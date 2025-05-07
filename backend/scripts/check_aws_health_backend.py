import subprocess
import json

BUCKET = "health-exposure-data"
LAMBDA = "health-exposure-fallback"

def run_aws_cmd(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        return None, result.stderr.strip()
    return json.loads(result.stdout), None

def check_s3_policy():
    print(f"\n🔍 Checking S3 bucket policy for: {BUCKET}")
    output, error = run_aws_cmd(["aws", "s3api", "get-bucket-policy", "--bucket", BUCKET])
    if error:
        print("❌ No bucket policy or access denied.")
        return

    policy = json.loads(output['Policy']) if isinstance(output, dict) else json.loads(output)
    statements = policy.get("Statement", [])
    for s in statements:
        actions = s.get("Action", [])
        if isinstance(actions, str): actions = [actions]
        if "s3:PutObject" in actions or "s3:DeleteObject" in actions:
            print("⚠️ Bucket allows public WRITE access — fix this!")
            return
    print("✅ Bucket is read-only to public (OK)")

def check_public_access_block():
    print(f"\n🔍 Checking public access block settings for: {BUCKET}")
    output, error = run_aws_cmd(["aws", "s3api", "get-bucket-public-access-block", "--bucket", BUCKET])
    if error:
        print("⚠️ Could not read public access block settings.")
        return
    config = output["PublicAccessBlockConfiguration"]
    if all(config.values()):
        print("❌ Public access completely blocked (not usable for public data)")
    elif not config.get("BlockPublicPolicy") and not config.get("IgnorePublicAcls"):
        print("✅ Public read access allowed (as intended)")
    else:
        print("⚠️ Mixed settings — review needed.")

def check_lambda_url():
    print(f"\n🔍 Checking Lambda Function URL for: {LAMBDA}")
    output, error = run_aws_cmd(["aws", "lambda", "get-function-url-config", "--function-name", LAMBDA])
    if error:
        print("⚠️ Could not fetch function URL config.")
        return
    auth = output.get("AuthType", "UNKNOWN")
    cors = output.get("Cors", {})
    print(f"🔐 AuthType: {auth}")
    if auth == "NONE":
        print("⚠️ Publicly accessible Lambda — monitor or limit usage.")
    else:
        print("✅ Access protected (IAM)")

    origins = cors.get("AllowOrigins", [])
    print(f"🌍 CORS AllowOrigins: {origins}")

def check_lambda_env():
    print(f"\n🔍 Checking Lambda environment variables for: {LAMBDA}")
    output, error = run_aws_cmd(["aws", "lambda", "get-function-configuration", "--function-name", LAMBDA])
    if error:
        print("⚠️ Could not fetch Lambda configuration.")
        return
    env = output.get("Environment", {}).get("Variables", {})
    api_key = env.get("OPENWEATHER_API_KEY", "")
    print("🔑 OPENWEATHER_API_KEY:", "✅ Set" if api_key else "❌ Missing")

if __name__ == "__main__":
    print("🔎 AWS Health Exposure Backend Security Check")
    check_s3_policy()
    check_public_access_block()
    check_lambda_url()
    check_lambda_env()
