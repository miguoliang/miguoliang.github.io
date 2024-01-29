1. Install [chocolatey](https://chocolatey.org/install)
   For windows, run powershell as administrator and run the following command:
    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    ```
2. Install Hugo
    ```powershell
    choco install hugo-extended
    ```
3. Clone this repository
4. Run the following command to start the server
    ```powershell
    hugo server
    ```