
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

type BaseContract = {
    packageId: string;
    stateId: string;
    adminCap: string;
    ownerId: string;
}
type Network = "mainnet" | "testnet"

const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

export const TestnetContract: BaseContract = {
    packageId: "0x45cb0622b656bd1be77da171287ffc1bf67bc11a90bd3077d6c710703a9a3980",
    stateId: "0x81144860ff68c1d1f536c98f11baf7525aa64f3fee1c9c97ccd44566892267b7",
    adminCap: "0x18f81cd19f3c3031da300ada2d29c979af927d61a0305b15dde0f8fccca38846",
    ownerId: "0x340ff414f778eb4ad4189770a1009ab3d980c1a6cc40832ceb00bf1faa43ad97",
}

export const MainnetContract: BaseContract = {
    packageId: "0x2",
    stateId: "",
    adminCap: "",
    ownerId: "",
}

const networkConfig = {
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: TestnetContract,
    },
    mainnet: {
        url: getFullnodeUrl("mainnet"),
        variables: MainnetContract,
    }
};

function getNetworkVariables(network: Network) {
    return networkConfig[network].variables;
}

// 创建全局 SuiClient 实例
const suiClient = new SuiClient({ url: networkConfig[network].url });

export { getNetworkVariables, networkConfig, network, suiClient };
