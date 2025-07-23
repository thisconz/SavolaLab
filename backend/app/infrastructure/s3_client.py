import boto3
from botocore.client import Config

# Import settings
from .config import settings

# --- S3 Client ---

# S3 Configuration
s3 = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT_URL,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="me-central-1",
)

# Upload a file to S3
def upload_file(
        file_obj, 
        key: str, 
        content_type: str):
    s3.upload_fileobj(
        file_obj,
        settings.S3_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": content_type},
    )

# Get a file from S3
def get_file(
        key: str):
    try:
        response = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return response["Body"].read()
    except s3.exceptions.NoSuchKey:
        return None

# Delete a file from S3
def delete_file(
        key: str):
    s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)

# List files in S3
def list_files(
        prefix: str = ""):
    paginator = s3.get_paginator("list_objects_v2")
    response_iterator = paginator.paginate(
        Bucket=settings.S3_BUCKET_NAME, Prefix=prefix
    )
    
    files = []
    for response in response_iterator:
        if "Contents" in response:
            for obj in response["Contents"]:
                files.append(obj["Key"])
    
    return files

# Check if a file exists in S3
def file_exists(
        key: str) -> bool:
    try:
        s3.head_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return True
    except s3.exceptions.ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return False
        raise

# Generate a presigned URL for a file in S3
def generate_presigned_url(
        key: str, 
        expires_in=3600):
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )

# Download a file from S3
def download_file(
        key: str):
    s3.download_file(settings.S3_BUCKET_NAME, key, key)