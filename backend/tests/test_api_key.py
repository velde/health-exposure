import os
import json
import boto3
import pytest
from datetime import datetime, timezone
import importlib

# Test data
TEST_API_KEY = "test-api-key-123"
TEST_ORIGIN = "https://health-exposure.app"
TEST_COORDINATES = {"lat": 61.4978, "lon": 23.7610}

def test_api_key_validation():
    """Test API key validation in Lambda function"""
    # Set up test environment
    os.environ["HEALTH_EXPOSURE_API_KEY"] = TEST_API_KEY
    
    # Create test event
    event = {
        "httpMethod": "GET",
        "queryStringParameters": TEST_COORDINATES,
        "headers": {
            "origin": TEST_ORIGIN,
            "x-api-key": TEST_API_KEY,
            "x-user-tier": "free"
        }
    }
    
    # Import Lambda handler
    lambda_function = importlib.import_module("lambda.lambda_function")
    lambda_handler = lambda_function.lambda_handler
    
    # Test with valid API key
    response = lambda_handler(event, {})
    assert response["statusCode"] == 200
    
    # Test with invalid API key
    event["headers"]["x-api-key"] = "invalid-key"
    response = lambda_handler(event, {})
    assert response["statusCode"] == 401
    assert "Invalid API key" in response["body"]
    
    # Test without API key
    del event["headers"]["x-api-key"]
    response = lambda_handler(event, {})
    assert response["statusCode"] == 401
    assert "Invalid API key" in response["body"]

def test_api_key_logging():
    """Test API key validation logging"""
    # Set up test environment
    os.environ["HEALTH_EXPOSURE_API_KEY"] = TEST_API_KEY
    
    # Create test event with invalid key
    event = {
        "httpMethod": "GET",
        "queryStringParameters": TEST_COORDINATES,
        "headers": {
            "origin": TEST_ORIGIN,
            "x-api-key": "invalid-key",
            "x-user-tier": "free"
        }
    }
    
    # Import Lambda handler
    lambda_function = importlib.import_module("lambda.lambda_function")
    lambda_handler = lambda_function.lambda_handler
    
    # Test logging of invalid API key
    response = lambda_handler(event, {})
    assert response["statusCode"] == 401
    
    # TODO: Add CloudWatch log verification
    # This would require setting up a CloudWatch client and checking logs
    # For now, we'll just verify the response 