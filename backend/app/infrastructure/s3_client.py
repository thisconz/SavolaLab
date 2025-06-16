import boto3
from botocore.client import Config
from .config import settings

# This module provides a client for interacting with AWS S3 or MinIO for file storage.
# Initialize the S3 client with the provided settings.
s3 = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT_URL,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="me-central-1",
)

# This module provides a client for interacting with AWS S3 or MinIO for file storage.
def upload_file(file_obj, key: str, content_type: str):
    s3.upload_fileobj(
        file_obj,
        settings.S3_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": content_type},
    )

# This module provides functions to interact with S3 for file operations.
def get_file(key: str):
    try:
        response = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return response["Body"].read()
    except s3.exceptions.NoSuchKey:
        return None

# This module provides functions to interact with S3 for file operations.
def delete_file(key: str):
    s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)

# This module provides functions to interact with S3 for file operations.
def generate_presigned_url(key: str, expires_in=3600):
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )

# This module provides functions to list files in an S3 bucket with a specific prefix.
def list_files(prefix: str = ""):
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

# This module provides a function to check if a file exists in S3.
def file_exists(key: str) -> bool:
    try:
        s3.head_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return True
    except s3.exceptions.ClientError as e:
        if e.response["Error"]["Code"] == "404":
            return False
        raise


