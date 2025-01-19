import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        // Validate query parameters
        const { queryStringParameters } = event;
        if (!queryStringParameters) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing query parameters" }),
            };
        }

        const { filename, content } = queryStringParameters;

        if (!filename || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Both 'filename' and 'content' parameters are required" }),
            };
        }

        // Upload content to S3
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: content,
            ContentType: "text/plain",
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "File uploaded successfully",
                filename,
            }),
        };
    } catch (error) {
        console.error("Error uploading file to S3:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error instanceof Error ? error.message : "Unknown error",
            }),
        };
    }
};