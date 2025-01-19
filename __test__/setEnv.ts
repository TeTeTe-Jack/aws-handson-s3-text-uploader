export default (): void => {
    console.log("\nSetup test environment");
    process.env.AWS_REGION = "ap-northeast-1";
    process.env.BUCKET_NAME = "test-bucket";
    console.log("process.env.AWS_REGION", process.env.AWS_REGION);
    console.log("process.env.BUCKET_NAME", process.env.BUCKET_NAME);
};