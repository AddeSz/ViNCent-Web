import type { Network } from "@/types/network";
import les_miserables from "./les-miserables/les_miserables_network.json";
import starwars from "./starwars-interactions/starwars_network.json";
import hierarchical from "./synthetic/network_hierarchical_n2000_l5000.json";
import interaction from "./synthetic/network_interactions_n500_l1500.json";
import massiveData from "./synthetic/network_n1000_l2500.json";
import n150 from "./synthetic/network_n150.json";
import n150T from "./synthetic/network_n150_time.json";
import clustered from "./synthetic/network_n500_l1500.json";

export const starwarsData: Network = starwars;
export const miserablesData: Network = les_miserables;
export const testDataSmall: Network = n150;
export const testDataTime: Network = n150T;
export const testDataCluster: Network = clustered;
export const testDataInteraction: Network = interaction;
export const testDataMassive: Network = massiveData;
export const testHierarchical: Network = hierarchical;
