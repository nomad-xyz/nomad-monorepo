use crate::CoreMetrics;
use prometheus::{HistogramVec, IntGaugeVec};
use std::sync::Arc;

/// Struct encapsulating prometheus metrics used by the ContractSync.
#[derive(Debug, Clone)]
pub struct ContractSyncMetrics {
    /// Most recently indexed block height (label values differentiate updates
    /// vs. messages)
    pub indexed_height: IntGaugeVec,
    /// Histogram of latencies from update emit to store
    pub store_event_latency: HistogramVec,
    /// Events stored into DB (label values differentiate updates vs. messages)
    pub stored_events: IntGaugeVec,
    /// Unique occasions when agent missed an event (label values
    /// differentiate updates vs. messages)
    pub missed_events: IntGaugeVec,
}

impl ContractSyncMetrics {
    /// Instantiate a new ContractSyncMetrics object.
    pub fn new(metrics: Arc<CoreMetrics>) -> Self {
        let indexed_height = metrics
            .new_int_gauge(
                "contract_sync_block_height",
                "Height of a recently observed block",
                &["data_type", "contract_name", "agent"],
            )
            .expect("failed to register block_height metric");
        let store_event_latency = metrics
            .new_histogram(
                "contract_sync_store_event_latency",
                "Latency between event emit and event store in db.",
                &["data_type", "contract_name", "agent"],
                &[
                    0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0,
                    160.0, 180.0, 200.0, 250.0, 300.0, 350.0, 400.0, 450.0, 500.0, 1000.0, 2000.0,
                ],
            )
            .expect("failed to register store_event_latency metric");

        let stored_events = metrics
            .new_int_gauge(
                "contract_sync_stored_events",
                "Number of events stored into db",
                &["data_type", "contract_name", "agent"],
            )
            .expect("failed to register stored_events metric");

        let missed_events = metrics
            .new_int_gauge(
                "contract_sync_missed_events",
                "Number of unique occasions when agent missed an event",
                &["data_type", "contract_name", "agent"],
            )
            .expect("failed to register missed_events metric");

        ContractSyncMetrics {
            indexed_height,
            store_event_latency,
            stored_events,
            missed_events,
        }
    }
}
