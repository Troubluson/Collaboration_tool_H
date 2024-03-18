from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Controller, Node
from mininet.cli import CLI
from mininet.log import setLogLevel, info, lg
from mininet.link import TCLink

# This helps to create a router between the two networks
class LinuxRouter( Node ):

    def config( self, **params ):
        super( LinuxRouter, self).config( **params )
        self.cmd( 'sysctl net.ipv4.ip_forward=1' )

    def terminate( self ):
        self.cmd( 'sysctl net.ipv4.ip_forward=0' )
        super( LinuxRouter, self ).terminate()
class NetworkTopo:

    def build():
        
        net = Mininet(controller=Controller, link=TCLink)
        
        h0_jitter = 10

        host_IPs = ['10.0.0.2/24','10.0.0.3/24','10.0.0.4/24','10.0.1.2/24']
        router_IP_left = '10.0.0.1/24'
        router_IP_right = '10.0.1.1/24'

        net.addController('c0')

        mid_r0 = net.addHost( name='r0', cls=LinuxRouter, ip=router_IP_left)
     
        left_s0 = net.addSwitch('s0')
        right_s1 = net.addSwitch('s1')
       
        net.addLink(left_s0, mid_r0, intfName='r0-eth1',params2={'ip' : router_IP_left})
        net.addLink(right_s1, mid_r0, intfName='r0-eth2',params2={'ip' : router_IP_right})

        left_h0 = net.addHost(name='h0', ip=host_IPs[0], defaultRoute='via 10.0.0.1')
        left_h1 = net.addHost(name='h1', ip=host_IPs[1], defaultRoute='via 10.0.0.1')
        left_h2 = net.addHost(name='h2', ip=host_IPs[2], defaultRoute='via 10.0.0.1')
        right_h3 = net.addHost(name='h3', ip=host_IPs[3], defaultRoute='via 10.0.1.1')


        net.addLink(left_h0,left_s0)
        net.addLink(left_h1,left_s0)
        net.addLink(left_h2,left_s0)
        net.addLink(right_h3,right_s1)

        net['r0'].cmd("ip route add 10.0.0.0/24 via 10.0.1.1 dev r0-eth2")
        net['r0'].cmd("ip route add 10.0.1.0/24 via 10.0.0.1 dev r0-eth1")

    
if __name__ == '__main__':
    
    net.start()

    CLI(net)

    net.stop()

