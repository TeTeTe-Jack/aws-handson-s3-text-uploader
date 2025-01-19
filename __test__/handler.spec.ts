import { handler } from "./../src/handler";
import { S3Client } from "@aws-sdk/client-s3";
import { Context, APIGatewayProxyResult } from "aws-lambda";

jest.mock("@aws-sdk/client-s3", () => {
    const mockS3Client = {
        send: jest.fn(),
    };
    return {
        S3Client: jest.fn(() => mockS3Client),
        PutObjectCommand: jest.fn((params) => params),
    };
});

describe("Lambda Function - Upload to S3", () => {
    const mockS3Client = new S3Client({});
    const mockEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...mockEnv, BUCKET_NAME: "test-bucket" };
    });

    afterAll(() => {
        process.env = mockEnv;
    });

    const mockContext: Context = {
        awsRequestId: "test-request-id",
        callbackWaitsForEmptyEventLoop: false,
        functionName: "test-function",
        functionVersion: "$LATEST",
        invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test-function",
        logGroupName: "/aws/lambda/test-function",
        logStreamName: "test-log-stream",
        memoryLimitInMB: "128",
        getRemainingTimeInMillis: () => 3000,
        done: () => {},
        fail: () => {},
        succeed: () => {},
    } as Context;

    it("should return 400 if query parameters are missing", async () => {
        const event = { queryStringParameters: null } as any;

        const result = (await handler(event, mockContext, () => {})) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(400);
        expect(result.body).toContain("Missing query parameters");
    });

    it("should return 400 if 'filename' or 'content' is missing", async () => {
        const event = {
            queryStringParameters: { filename: "test.txt" },
        } as any;

        const result = (await handler(event, mockContext, () => {})) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(400);
        expect(result.body).toContain("Both 'filename' and 'content' parameters are required");
    });

    it("should upload file to S3 and return 200", async () => {
        const event = {
            queryStringParameters: {
                filename: "test.txt",
                content: "Hello World",
            },
        } as any;

        (mockS3Client.send as jest.Mock).mockImplementation((command) => {
            return Promise.resolve(command.input);
        });

        const result = (await handler(event, mockContext, () => {})) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(200);
        expect(result.body).toContain("File uploaded successfully");
        expect(mockS3Client.send).toHaveBeenCalledWith(
            expect.objectContaining({
                Bucket: "test-bucket",
                Key: "test.txt",
                Body: "Hello World",
            })
        );
    });
    it("should return 500 if S3 upload fails", async () => {
        const event = {
            queryStringParameters: {
                filename: "test.txt",
                content: "Hello World",
            },
        } as any;

        (mockS3Client.send as jest.Mock).mockRejectedValueOnce(new Error("S3 upload error"));

        const result = (await handler(event, mockContext, () => {})) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(500);
        expect(result.body).toContain("Internal Server Error");
        expect(result.body).toContain("S3 upload error");
    });
    it("should return 500 if unkwon error", async () => {
        const event = {
            queryStringParameters: {
                filename: "test.txt",
                content: "Hello World",
            },
        } as any;

        (mockS3Client.send as jest.Mock).mockRejectedValueOnce("test");

        const result = (await handler(event, mockContext, () => {})) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(500);
        expect(result.body).toContain("Internal Server Error");
        expect(result.body).toContain("Unknown error");
    });
});
