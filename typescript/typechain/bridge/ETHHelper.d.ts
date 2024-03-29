/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface ETHHelperInterface extends ethers.utils.Interface {
  functions: {
    "bridge()": FunctionFragment;
    "send(uint32,bool)": FunctionFragment;
    "sendTo(uint32,bytes32,bool)": FunctionFragment;
    "sendToEVMLike(uint32,address,bool)": FunctionFragment;
    "weth()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "bridge", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "send",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "sendTo",
    values: [BigNumberish, BytesLike, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "sendToEVMLike",
    values: [BigNumberish, string, boolean]
  ): string;
  encodeFunctionData(functionFragment: "weth", values?: undefined): string;

  decodeFunctionResult(functionFragment: "bridge", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "send", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "sendTo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "sendToEVMLike",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "weth", data: BytesLike): Result;

  events: {
    "Send(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Send"): EventFragment;
}

export class ETHHelper extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ETHHelperInterface;

  functions: {
    bridge(overrides?: CallOverrides): Promise<[string]>;

    send(
      _domain: BigNumberish,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sendTo(
      _domain: BigNumberish,
      _to: BytesLike,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sendToEVMLike(
      _domain: BigNumberish,
      _to: string,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    weth(overrides?: CallOverrides): Promise<[string]>;
  };

  bridge(overrides?: CallOverrides): Promise<string>;

  send(
    _domain: BigNumberish,
    _enableFast: boolean,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sendTo(
    _domain: BigNumberish,
    _to: BytesLike,
    _enableFast: boolean,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sendToEVMLike(
    _domain: BigNumberish,
    _to: string,
    _enableFast: boolean,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  weth(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    bridge(overrides?: CallOverrides): Promise<string>;

    send(
      _domain: BigNumberish,
      _enableFast: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    sendTo(
      _domain: BigNumberish,
      _to: BytesLike,
      _enableFast: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    sendToEVMLike(
      _domain: BigNumberish,
      _to: string,
      _enableFast: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    weth(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    Send(from?: string | null): TypedEventFilter<[string], { from: string }>;
  };

  estimateGas: {
    bridge(overrides?: CallOverrides): Promise<BigNumber>;

    send(
      _domain: BigNumberish,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sendTo(
      _domain: BigNumberish,
      _to: BytesLike,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sendToEVMLike(
      _domain: BigNumberish,
      _to: string,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    weth(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    bridge(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    send(
      _domain: BigNumberish,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sendTo(
      _domain: BigNumberish,
      _to: BytesLike,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sendToEVMLike(
      _domain: BigNumberish,
      _to: string,
      _enableFast: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    weth(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
