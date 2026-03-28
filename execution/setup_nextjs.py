import subprocess
import os

def main():
    print("[INFO] Starting Next.js setup via Python subprocess...")
    
    # Target directory is the workspace root (parent of execution folder)
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # We will scaffold into a clean "web/" subfolder to prevent conflicts 
    # with the existing GEMINI.md, execution/, and directives/ folders.
    cmd = [
        "npx", 
        "-y",
        "create-next-app@latest", 
        "web", 
        "--typescript", 
        "--eslint", 
        "--app", 
        "--no-tailwind", 
        "--src-dir", 
        "--import-alias", "@/*"
    ]
    
    print(f"[INFO] Running command: {' '.join(cmd)}")
    print(f"[INFO] In directory: {workspace_dir}")
    
    try:
        # Run process. shell=True is required on Windows to resolve 'npx' execution
        result = subprocess.run(
            cmd,
            cwd=workspace_dir,
            shell=True,
            check=True,
            text=True
        )
        print("[SUCCESS] Next.js application initialized successfully in the /web folder!")
        print("[INFO] You can now cd into the 'web' folder and run 'npm run dev' to view it.")
        
    except subprocess.CalledProcessError as e:
        print(f"[FAIL] Command failed with return code {e.returncode}")
    except Exception as e:
        print(f"[FAIL] An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    main()
