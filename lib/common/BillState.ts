
// lower case to abuse the fact that
// BillState[BillState.open] == "open"
enum BillState {
  open,
  closed
};

module BillState {
  export function toggleState(billState) {
    return Number(!billState);
  }
}

export = BillState;
