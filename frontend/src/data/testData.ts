import n150 from "@/data/network_test_data_n150.json";
import n150T from "@/data/network_test_data_n150_time.json";
import n50 from "@/data/network_test_data_n50.json";
import starwars from "@/data/starwars-interactions/starwars_network.json";
import type { Network } from "@/types/network";
import les_miserables from "./les-miserables/les_miserables_network.json";

export const starwarsData: Network = starwars;
export const miserablesData: Network = les_miserables;
export const testData: Network = n150;
export const testDataSmall: Network = n50;
export const testDataTime: Network = n150T;
