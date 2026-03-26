import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

actor {
  module Preferences {
    public func compare(p1 : Preferences, p2 : Preferences) : Order.Order {
      Text.compare(p1.preferredAiProvider, p2.preferredAiProvider);
    };
  };

  type Preferences = {
    preferredAiProvider : Text;
  };

  let userPreferences = Map.empty<Principal, Preferences>();

  public shared ({ caller }) func setPreferences(preferredAiProvider : Text) : async () {
    let preferences : Preferences = {
      preferredAiProvider;
    };
    userPreferences.add(caller, preferences);
  };

  public query ({ caller }) func getMyPreferences() : async Preferences {
    switch (userPreferences.get(caller)) {
      case (null) { Runtime.trap("Preferences not found!") };
      case (?prefs) { prefs };
    };
  };

  public query ({ caller }) func getAllPreferences() : async [Preferences] {
    userPreferences.values().toArray().sort();
  };

  public query ({ caller }) func isRegistered() : async Bool {
    userPreferences.containsKey(caller);
  };
};
