{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    python3Packages.pip
    python3Packages.virtualenv
    
    # Required system dependencies for building packages
    gcc
    postgresql.lib
    stdenv.cc.cc.lib
  ];

  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];

  shellHook = ''
    echo "NixOS Python Dev Environment Loaded!"
    echo "To setup the local python environment run:"
    echo "python -m venv .venv"
    echo "source .venv/bin/activate"
    echo "pip install -r backend/requirements.txt"
  '';
}
