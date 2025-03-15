# Video Management Scripts

This directory contains scripts for managing video content in the EZpass application.

## Update Vimeo Settings

The `update_vimeo_settings.py` script updates the embed settings for all your Vimeo videos to allow them to be embedded in the EZpass application.

### Setup

1. Install the required Python package:
   ```bash
   pip install -r requirements.txt
   ```

2. Set your Vimeo access token as an environment variable:
   ```bash
   # On Windows (PowerShell):
   $env:VIMEO_ACCESS_TOKEN = 'your_token_here'

   # On Windows (Command Prompt):
   set VIMEO_ACCESS_TOKEN=your_token_here

   # On Linux/Mac:
   export VIMEO_ACCESS_TOKEN='your_token_here'
   ```

### Usage

Run the script:
```bash
python update_vimeo_settings.py
```

The script will:
1. Fetch all videos from your Vimeo account
2. Update each video's embed settings to allow embedding on:
   - localhost:3000 (for development)
   - ezpass.demo (for production)
3. Show progress as it works
4. Provide a summary at the end

### Adding New Domains

To add new domains where videos can be embedded, edit the `ALLOWED_DOMAINS` list in `update_vimeo_settings.py`. 