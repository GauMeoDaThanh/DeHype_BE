# Base64 Encoding and Decoding for .env Files

## Overview

This document provides instructions for encoding and decoding `.env` files using base64. This process is useful for securely handling sensitive configuration data, ensuring it can be safely stored or transmitted.

## Prerequisites

- Ensure you have the following tools installed on your system:
  - A terminal or command prompt
  - `base64` command-line utility (available by default on most Unix-like systems and can be installed on Windows)

## Encoding a .env File

To encode a `.env` file into a base64 format, follow these steps:

1. **Open your terminal or command prompt.**
2. **Navigate to the directory containing your `.env` file.** For example:
   ```bash
   cd /path/to/your/directory
   ```
3. **Run the following command to encode the `.env` file:**
   ```bash
   base64 .env > encoded_env.txt

    base64 -i wallet.json > encoded_wallet.txt
   ```
   - This command will read the `.env` file, encode its contents, and save the output to `encoded_env.txt`.

## Decoding a base64 Encoded File

To decode a previously encoded base64 file and restore it to its original format:

1. **Open your terminal or command prompt.**
2. **Navigate to the directory containing your encoded file.**
3. **Run the following command to decode the file:**
   ```bash
   base64 -d encoded_env.txt > .env
   ```
   - This command will read `encoded_env.txt`, decode its contents, and save the output to `.env`.

### Example Workflow

1. **Encode the `.env` file:**
   ```bash
   base64 .env > encoded_env.txt
   base64 wallet.json > encoded_wallet.txt

   ```

2. **Verify that the encoding was successful:**
   ```bash
   cat encoded_env.txt
   ```

3. **Decode the encoded file:**
   ```bash
   base64 -d encoded_env.txt > .env
   ```

4. **Verify that the decoding was successful:**
   ```bash
   cat .env
   ```

## Notes

- Ensure that the base64 command is available on your system. You can verify its availability by running `base64 --version`.
- Use caution when handling sensitive information in `.env` files. Always ensure they are not exposed in public repositories or logs.

## Troubleshooting

- If you encounter issues with the commands, ensure that:
  - You have the correct file path and permissions.
  - You are using the correct base64 syntax for your operating system.

