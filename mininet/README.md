# Install

## Debian

sudo apt-get install mininet

sudo apt-get install openvswitch-switch
sudo service openvswitch-switch start
or
sudo systemctl start ovs-vswitchd.service

Selenium installation

pip3 install selenium

For testing script geckodrivers are required. These are found here:

https://github.com/mozilla/geckodriver/releases/download/v0.34.0/geckodriver-v0.34.0-linux64.tar.gz

Firefox needs to be installed in the system.

## Possibly needed modifications

Create a symlink to use openflow controller.
sudo ln /usr/bin/ovs-vsctl /usr/bin/controller

## How to use

There is a python script to create the environment.

First install mininet packages:
pip3 install mininet

There is some CONFIG variables which require adaptation to match the device used to for the environment.

These are:
'file_path': '/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/upload/ping_file.png',
'large_file_path' : '/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/upload/testing_file_large.jpg',
'executable_path' : '/home/qtio/Downloads/apps/geckodrivers/geckodriver',

file_path and large_file_path is the location of the ping_file which will be in the Collaboration_tool direcotry.

executable path is the location of geckodrivers which one downloaded from the given address.

run
sudo python3 env_script.py

## Cleanup

To clean everything just run the following
run mn -c

## Source

https://mininet.org/download/#option-3-installation-from-packages
