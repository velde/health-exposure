# Local Development Setup

## Prerequisites
- Python 3.11 or later
- Docker (for Lambda packaging)
- AWS CLI configured with appropriate credentials
- Required API keys (see Environment Variables section)

## Environment Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Running Locally

### Testing Lambda Functions

1. Test the main Lambda function:
```bash
python -c "from lambda.lambda_function import lambda_handler; print(lambda_handler({'queryStringParameters': {'lat': 60.17, 'lon': 24.93}}, None))"
```

2. Test the scheduler function:
```bash
python -c "from lambda.scheduler_function import lambda_handler; print(lambda_handler({}, None))"
```

### Building and Deploying

1. Build the Lambda package:
```bash
docker build --platform linux/amd64 -t health-lambda .
docker run --rm --platform linux/amd64 -v "$PWD":/out --entrypoint bash health-lambda -c "cd /var/task && zip -r /out/lambda_deploy.zip ."
```

2. Deploy to AWS:
```bash
aws lambda update-function-code --function-name health-exposure-fallback --zip-file fileb://lambda_deploy.zip
```

## Scheduler Behavior

The scheduler function runs every 15 minutes and:
- Checks all cells for news data older than 6 hours
- Processes up to 10 oldest cells per run
- Prioritizes cells with the oldest news first
- Staggers updates throughout the day to distribute load

### Testing the Scheduler

1. Manual trigger:
```bash
aws lambda invoke --function-name health-exposure-scheduler response.json
```

2. Monitor CloudWatch logs:
```bash
aws logs get-log-events --log-group-name /aws/lambda/health-exposure-scheduler --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/health-exposure-scheduler --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text)
```

## API Rate Limiting

The API implements rate limiting:
- Free tier: 100 requests per hour
- Premium tier: 1000 requests per hour

Rate limits are enforced per user ID (x-user-id header).

## Input Validation

The API validates:
- Latitude: -90 to 90
- Longitude: -180 to 180
- H3 cell format
- User tier values
- Required headers

## Troubleshooting

1. Check CloudWatch logs for errors
2. Verify API keys are correctly set
3. Ensure S3 bucket exists and is accessible
4. Check IAM permissions for Lambda functions

## Contributing

1. Create a new branch for your changes
2. Add tests for new functionality
3. Update documentation as needed
4. Submit a pull request 