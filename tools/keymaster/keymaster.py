#!/usr/bin/python3
# keymaster.py
# Used to perform agent wallet maintenance like: 
# top-up - ensures configured addresses have sufficient funds

from asyncio.log import logger
from utils import dispatch_signed_transaction, hexkey_info
from web3 import Web3
from prometheus_client import start_http_server, Counter, Gauge
from config import load_config
from utils import check_account, create_transaction, get_nonce, get_block_height

import click
import logging
import json 
import sys 
import time

# Set up prometheus metrics 
metrics = {
    "wallet_balance": Gauge("ethereum_wallet_balance", "ETH Wallet Balance", ["role", "home", "address", "network"]),
    "transaction_count": Gauge("ethereum_transaction_count", "ETH Wallet Balance", ["role", "home", "address", "network"]),
    "block_number": Gauge("ethereum_block_height", "Block Height", ["network"]),
    "failed_tx_count": Counter("keymaster_failed_tx_count", "Number of Failed Keymaster Top-Ups", ["network", "to", "error"])
}

@click.group()
@click.option('--debug/--no-debug', default=False)
@click.option('--config-path', default="./config/keymaster.json")
@click.pass_context
def cli(ctx, debug, config_path):
    ctx.ensure_object(dict)
    ctx.obj['DEBUG'] = debug

    conf = load_config(config_path)

    if conf:
        ctx.obj['CONFIG'] = conf
    else: 
        # Failed to load config, barf 
        click.echo(f"Failed to load config from {config_path}, check the file and try again.")
        sys.exit(1)

    
    # Set up logging
    logging.basicConfig(stream=sys.stdout, level=logging.INFO)

    if debug:
        click.echo(f"Loaded config from {config_path}")
        click.echo(json.dumps(ctx.obj['CONFIG'], indent=2))

@cli.command()
@click.pass_context
@click.option('--metrics-port', default=9090, help="Port to bind metrics server to.")
@click.option('--pause-duration', default=30, help="Number of seconds to sleep between polling.")
def monitor(ctx, metrics_port, pause_duration):
    """Simple program that polls one or more ethereum accounts and reports metrics on them."""
    # Get config
    config = ctx.obj["CONFIG"]

    # Set up logging
    logging.basicConfig(stream=sys.stdout, level=logging.INFO)

    # run metrics endpoint
    start_http_server(metrics_port)
    logging.info(f"Running Prometheus endpoint on port {metrics_port}")

    logging.info("Executing event loop, Ctrl+C to exit.")
    # main event loop
    while True:
        logger.info("== == Starting run! == ==")
        # Collect statuses and batch-process at the end
        statuses = []
        # For each configured home
        for home_name, home in config["homes"].items():
            # Get status on Home for role
            home_config = config["networks"][home_name] 
            endpoint = home_config["endpoint"]
            threshold = home_config["threshold"]

            # Fetch block height for home network
            try:
                block_height = get_block_height(endpoint)
                metrics["block_number"].labels(network=home_name).set(block_height)
            except ValueError:
                continue

            # Fetch Bank status for Home
            address = home_config["bank"]["address"]
            status = check_account(home_name, home_name, "bank", address, endpoint, threshold, logger)
            statuses.append(status)

            # Get statuses, see if we need to top-up
            for role, address in home["addresses"].items():
                
                # only process agents that act on the home
                if role in ["updater", "kathy", "watcher"]:
                    # Watcher only needs 1/4 the funds as the rest of the agents
                    if role == "watcher": 
                        threshold = threshold / 4
                    status = check_account(home_name, home_name, role, address, endpoint, threshold, logger)
                    statuses.append(status)

                # only process agents that act on the replica
                if role in ["relayer", "processor"]:
                    # Get status on Home's replicas for role
                    for replica_name in home["replicas"]:
                        replica_config = config["networks"][replica_name] 
                        endpoint = replica_config["endpoint"]
                        threshold = replica_config["threshold"] / 4
                        status = check_account(home_name, replica_name, role, address, endpoint, threshold, logger)
                        statuses.append(status)
            
        logger.info("== == == == Done inspecting wallets, now processing top-ups. == == == ==")
        # sort and process banks first
        
        statuses = sorted(statuses, key = lambda s: s["role"])
        for status in statuses:
            # unpack status
            role = status["role"]
            home_network = status["home"]
            address = status["address"]
            target_network = status["target_network"]

            # report metrics 
            metrics["wallet_balance"].labels(role=role, home=home_network, address=address, network=target_network).set(status["wallet_balance"])
            metrics["transaction_count"].labels(role=role, home=home_network, address=address, network=target_network).set(status["transaction_count"])
            
            # Should we top-up? 
            if role != "bank" and status["should_top_up"]:
                amount = status["top_up_amount"]
                bank_endpoint = config["networks"][target_network]["endpoint"]
                bank_address = config["networks"][target_network]["bank"]["address"]
                bank_signer = config["networks"][target_network]["bank"]["signer"]
                bank_nonce = get_nonce(bank_address, bank_endpoint)
                transaction_tuple = create_transaction(bank_signer, address, amount, bank_nonce, bank_endpoint)
                logging.info(f"Attempting to send transaction of {amount * 10**-18} {home_network} {role} ({address}) on {target_network}")
                try: 
                    hash = dispatch_signed_transaction(transaction_tuple[1], bank_endpoint)
                    logging.info(f"Dispatched Transaction: {hash}")
                    time.sleep(3)
                # Catch ValueError when the transaction fails for some reason
                except ValueError as e:
                    metrics["failed_tx_count"].labels(network=target_network, to=address, error=str(e)).inc()
                    pass
        
        logging.info(f"== Done with run -- sleeping for {pause_duration} seconds ==")
        time.sleep(pause_duration)

@cli.command()
@click.pass_context
@click.argument('hex-key')
def hex_key(ctx, hex_key):
    address = hexkey_info(hex_key)
    logging.info(f"Address: {address}")
    

if __name__ == '__main__':
    cli(obj={})