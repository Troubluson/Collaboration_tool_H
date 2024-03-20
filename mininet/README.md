# Install

## Debian

sudo apt-get install mininet

sudo apt-get install openvswitch-switch
sudo service openvswitch-switch start
or
sudo systemctl start ovs-vswitchd.service

Selenium installation

pip3 install selenium

## Possibly needed modifications

Create a symlink to use openflow controller.
sudo ln /usr/bin/ovs-vsctl /usr/bin/controller

## How to use

There is a python script to create the environment.

First install mininet packages:
pip3 install mininet

run
sudo python3 env_script.py

## Cleanup

To clean everything just run the following
run mn -c

## Source

https://mininet.org/download/#option-3-installation-from-packages
