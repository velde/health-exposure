FROM public.ecr.aws/lambda/python:3.11

# Install build tools
RUN yum install -y gcc zip python3.11-devel

# Install requirements and force h3 to compile for x86_64
COPY requirements.txt .
RUN pip3 install --no-binary=h3 -r requirements.txt -t /var/task/

# Copy files directly to /var/task (no subfolder)
COPY lambda/lambda_function.py /var/task/
COPY lambda/scheduler_function.py /var/task/
COPY lambda/adapters /var/task/adapters
COPY lambda/__init__.py /var/task/

