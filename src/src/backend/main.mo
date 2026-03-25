import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";



actor {
  type UPIStatus = {
    #running;
    #online;
  };

  type UPIEntry = {
    upiId : Text;
    status : UPIStatus;
    todayCommission : Float;
    totalCommission : Float;
  };

  type DashboardStats = {
    totalCurrentBalance : Float;
    transferIn : Float;
    transferOut : Float;
    lockedDeposit : Float;
    todayCommission : Float;
  };

  type DepositRecord = {
    amount : Float;
    utrNumber : Text;
    timestamp : Int;
  };

  let upiEntries = Map.empty<Text, UPIEntry>();

  var dashboardStats : DashboardStats = {
    totalCurrentBalance = 0.0;
    transferIn = 0.0;
    transferOut = 0.0;
    lockedDeposit = 0.0;
    todayCommission = 0.0;
  };

  let depositHistory = List.empty<DepositRecord>();

  public shared ({ caller }) func addUpiEntry(upiId : Text) : async () {
    let entry : UPIEntry = {
      upiId;
      status = #running;
      todayCommission = 0.0;
      totalCommission = 0.0;
    };
    upiEntries.add(upiId, entry);
  };

  public shared ({ caller }) func deleteUpiEntry(upiId : Text) : async () {
    if (not upiEntries.containsKey(upiId)) {
      Runtime.trap("UPI entry does not exist");
    };
    upiEntries.remove(upiId);
  };

  public query ({ caller }) func getAllUpiEntries() : async [UPIEntry] {
    upiEntries.values().toArray();
  };

  public shared ({ caller }) func updateDashboardStats(stats : DashboardStats) : async () {
    dashboardStats := stats;
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    dashboardStats;
  };

  public shared ({ caller }) func addDeposit(amount : Float, utrNumber : Text) : async () {
    let newDeposit : DepositRecord = {
      amount;
      utrNumber;
      timestamp = Time.now();
    };
    depositHistory.add(newDeposit);

    dashboardStats := {
      dashboardStats with
      lockedDeposit = dashboardStats.lockedDeposit + amount;
      totalCurrentBalance = dashboardStats.totalCurrentBalance + amount;
    };
  };

  public query ({ caller }) func getDepositHistory() : async [DepositRecord] {
    depositHistory.toArray();
  };
};
