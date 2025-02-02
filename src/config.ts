
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
    packageId: "0x1aad7ad62528f3223909c0337b890adc4ff717eff8cdf6afb165503df58fdcc3",
    stateId: "0xb29e479fc9818dffca158bcc5fe4698bdc5f3d1bf8d19449d1aed777e380eb12",
    adminCap: "0x5af8b1db5ce99600a4af66cae6df53b6fe6cf5b48d36464664913184eaa78c8b",
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
