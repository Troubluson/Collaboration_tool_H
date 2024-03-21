from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
import unittest

CONFIG = {
    'username': 'user',
    'channel_name': 'channel',
    'message': 'Test message',
    'file_path': '/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/ping_file.png',
    'executable_path' : '/home/qtio/Downloads/apps/geckodrivers/geckodriver',
    'url': 'http://10.0.1.2:3000',
    'username_field_name': 'username',
    'created_channel' : 'channel',
    'logged_in' : False 
}

class TestMyWebApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # set up Firefox options
        options = Options()
        #options.add_argument('-headless')  # use this line to set headless mode

        # set up Firefox service
        service = Service(executable_path=CONFIG['executable_path'])

        # create a new Firefox browser instance with options
        cls.driver = webdriver.Firefox(service=service, options=options)
        breaker = True
        counter = 0
        u_name = CONFIG['username'] + "_" + str(counter)
        while breaker:
            cls.navigate_to_app(cls, CONFIG['url'])
            cls.login(cls, CONFIG['username_field_name'], u_name)
            breaker = not cls.check_login(cls)
            counter += 1
            u_name = CONFIG['username'] + "_" + str(counter)
        CONFIG['username'] = u_name
        CONFIG['logged_in'] = True

    @classmethod
    def tearDownClass(cls):
        if CONFIG['logged_in']:
            cls.logout(cls) 
            cls.driver.quit()
        else: 
            cls.driver.quit()
        
    def logout(self):
        logout_button = self.driver.find_element("xpath", "//span[text()='Logout']")
        logout_button.click()

    def navigate_to_app(self, url):
        self.driver.get(url)

    def login(self, username_field_name, username):
        username_field = self.driver.find_element("id", username_field_name)
        username_field.send_keys(username)
        username_field.send_keys(Keys.RETURN)

    def check_login(self):
        time.sleep(1)  # wait for the page to load
        try:
            login_display = self.driver.find_element("xpath", "//*[contains(text(), '{}')]".format("Select A Channel From the Sidebar"))
            return True
        except:
            return False

    def get_available_channels(self):
        # find all the channel elements
        channel_elements = self.driver.find_elements("xpath", "//li[@role='menuitem']/span")
        
        # get the name of each channel
        channel_names = [channel.text for channel in channel_elements]
        
        return channel_names

    def create_channel(self, channel_name):
        # check if the channel already exists
        available_channels = self.get_available_channels()
        original_channel_name = channel_name
        counter = 1

        while channel_name in available_channels:
            channel_name = original_channel_name + "_" + str(counter)
            counter += 1
            
        CONFIG['created_channel'] = channel_name

        # find the "Create Channel" button and click it
        create_channel_button = self.driver.find_element("xpath", "//span[text()='Create Channel']")
        create_channel_button.click()
        time.sleep(1)  # wait for the prompt to appear

        # enter the channel name in the prompt
        channel_name_prompt = self.driver.find_element("css selector", "input.ant-input.css-dev-only-do-not-override-1c3asd8.ant-input-outlined")
        channel_name_prompt.send_keys(channel_name)
        channel_creaton_ok_button = self.driver.find_element("xpath", "//span[text()='OK']")
        channel_creaton_ok_button.click()
        time.sleep(1)

    def select_channel(self, channel_name):
        try:
            channel_button = self.driver.find_element("xpath", f"//span[text()='{channel_name}']")
            channel_button.click()
        except Exception as e: 
            print(f"Test failed: {e}")
            self.tearDownClass()
            raise
    
    def leave_channel(self, channel_name):
        try: 
            channel_button = self.driver.find_element("xpath", f"//span[text()='{channel_name}']")
            channel_button.click()
            leave_channel_button = self.driver.find_element("xpath", f"//span[text()='Leave Channel']")
            leave_channel_button.click()
        except Exception as e: 
            print(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def send_message(self, message):
        message_box = self.driver.find_element("css selector", "input[style='flex-grow: 1; margin-left: 1rem;']")
        message_box.send_keys(message)
        message_box.send_keys(Keys.RETURN)

    def upload_file(self, file_path):
        file_input = self.driver.find_element("css selector", "input[type='file']")
        file_input.send_keys(file_path)

    def test_create_channel(self):
        try:
            self.create_channel(CONFIG['channel_name'])
            self.assertIn(CONFIG['channel_name'], self.get_available_channels())
        except Exception as e:
            print(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def test_send_message(self):
        try:
            self.select_channel(CONFIG['created_channel'])
            self.send_message(CONFIG['message'])
            # Add assertions to check the message was sent
        except Exception as e:
            print(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def test_upload_file(self):
        try:
            self.select_channel(CONFIG['created_channel'])
            self.upload_file(CONFIG['file_path'])
            self.leave_channel(CONFIG['created_channel'])
            # Add assertions to check the file was uploaded
        except Exception as e:
            print(f"Test failed: {e}")
            self.tearDownClass()
            raise

if __name__ == "__main__":
    unittest.main()
