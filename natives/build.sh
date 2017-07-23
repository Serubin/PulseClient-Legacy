#!/bin/bash

echo "This script requires Wine and Nativefier"

nativefier -p windows --single-instance --internal-urls "pulse.serubin.net" --name "Pulse" --icon pulse.png https://pulse.serubin.net
nativefier -p osx --single-instance --internal-urls "pulse.serubin.net" --name "Pulse" --icon pulse.icns https://pulse.serubin.net
nativefier -p linux --single-instance --internal-urls "pulse.serubin.net" --name "Pulse" --icon pulse.png https://pulse.serubin.net
