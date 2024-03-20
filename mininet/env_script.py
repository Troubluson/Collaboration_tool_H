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

class NetworkTopo(Topo):

    def build(self):
        
        h0_jitter = 10

        host_IPs = ['10.0.0.2/24','10.0.0.3/24','10.0.0.4/24','10.0.1.2/24']
        router_IP_left = '10.0.0.1/24'
        router_IP_right = '10.0.1.1/24'
        router_IP_nat = '10.0.2.1/24'
        nat_IP = '10.0.2.254/24'

        mid_r0 = self.addHost( name='r0', cls=LinuxRouter, ip=router_IP_left)
     
        left_s0 = self.addSwitch('s0')
        right_s1 = self.addSwitch('s1')
       
        self.addLink(left_s0, mid_r0, intfName='r0-eth1',params2={'ip' : router_IP_left})
        self.addLink(right_s1, mid_r0, intfName='r0-eth2',params2={'ip' : router_IP_right})

        left_h0 = self.addHost(name='h0', ip=host_IPs[0], defaultRoute='via 10.0.0.1')
        left_h1 = self.addHost(name='h1', ip=host_IPs[1], defaultRoute='via 10.0.0.1')
        left_h2 = self.addHost(name='h2', ip=host_IPs[2], defaultRoute='via 10.0.0.1')
        right_h3 = self.addHost(name='h3', ip=host_IPs[3], defaultRoute='via 10.0.1.1')

        # Add links and make h0 s0 connection slow artificially (affects also socks proxy but lets test this it just might only be statistica)
        self.addLink(left_h0,left_s0, cls=TCLink, delay='100ms', bw=1)
        self.addLink(left_h1,left_s0)
        self.addLink(left_h2,left_s0)
        self.addLink(right_h3,right_s1)
        
        nat = self.addNode('nat', ip=nat_IP, inNamespace=False)
        self.addLink(nat,mid_r0, intfName2='r0-eth3',params1={'ip' : nat_IP}, params2={'ip' : router_IP_nat})
        
        

def run():
    topo = NetworkTopo()
    net = Mininet( topo=topo, controller=Controller, link=TCLink)
    net.start()

    # Start sshd on each host 
    for host in net.hosts:
        host.cmd('/usr/sbin/sshd -D &')

    # Routing for the router
    net['r0'].cmd("ip route add 10.0.0.0/24 via 10.0.1.1 dev r0-eth2")
    net['r0'].cmd("ip route add 10.0.1.0/24 via 10.0.0.1 dev r0-eth1")
    net['r0'].cmd("ip route add default via 10.0.2.254 dev r0-eth3")

    # Routing for the nat node
    net['nat'].cmd("ip route add 10.0.0.0/24 via 10.0.2.1 dev nat-eth0")
    net['nat'].cmd("ip route add 10.0.1.0/24 via 10.0.2.1 dev nat-eth0")

    # Now lastly configure the NAT to give hosts access to network
    # In here replace wlp1s0 with the network interface which is connected to the internet
    # You can find this by checking with "ip route | grep default" after dev is the network interface
    net['nat'].cmd("iptables -t nat -A POSTROUTING -o wlp1s0 -j MASQUERADE")
    net['nat'].cmd("iptables -A FORWARD -i wlp1s0 -o r0-eth3 -m state --state RELATED,ESTABLISHED -j ACCEPT")
    net['nat'].cmd("iptables -A FORWARD -i r0-eth3 -o wlp1s0 -j ACCEPT")
    
    # Lastly we need to run the application in the h3
    # net['h3'].cmd("")
    
    CLI( net )
    net.stop()
    
if __name__ == '__main__':
    setLogLevel('info')
    run()