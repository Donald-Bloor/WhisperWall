import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const d = await deploy("WishBoard", { from: deployer, log: true });
  log(`WishBoard deployed at ${d.address}`);
};

export default func;
func.id = "deploy_wishboard";
func.tags = ["WishBoard"];


