import os
import sys

def update_client_id(new_id):
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    files_to_update = [
        os.path.join(project_root, 'backend', '.env'),
        os.path.join(project_root, 'frontend', 'pages', 'login.html')
    ]
    
    old_id = "32376731310-1nhll8ho76buova90n1fvhikmtqn79mb.apps.googleusercontent.com"
    
    for file_path in files_to_update:
        if not os.path.exists(file_path):
            print(f"Warning: File not found: {file_path}")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if old_id in content:
            new_content = content.replace(old_id, new_id)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully updated: {file_path}")
        else:
            print(f"Old Client ID not found in: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_google_id.py <YOUR_NEW_GOOGLE_CLIENT_ID>")
    else:
        update_client_id(sys.argv[1])
