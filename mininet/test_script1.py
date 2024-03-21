from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from datetime import datetime
import time
import unittest
import logging

# Create a logger
logger = logging.getLogger('selenium_tests')
logger.setLevel(logging.INFO)

# Create a file handler
handler = logging.FileHandler('test_results1.log')
handler.setLevel(logging.INFO)

# Create a logging format
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add the handler to the logger
logger.addHandler(handler)

CONFIG = {
    'username': 'user',
    'channel_name': 'h1_channel',
    'message': 'Test message',
    'file_path': '/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/upload/ping_file.png',
    'large_file_path' : '/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/upload/testing_file_large.jpg',
    'executable_path' : '/home/qtio/Downloads/apps/geckodrivers/geckodriver',
    'url': 'http://10.0.1.2:3000',
    'username_field_name': 'username',
    'created_channel' : '',
    'testing_channel' : 'testing_channel',
    'logged_in' : False 
}

class TestMyWebApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # set up Firefox options
        options = Options()
        options.add_argument('-headless') 

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
        logger.info(f"Successfully logged in as user {u_name}")

    @classmethod
    def tearDownClass(cls):
        if CONFIG['logged_in']:
            cls.logout(cls) 
            cls.driver.quit()
        else: 
            cls.driver.quit()
        logger.info("Test ended")
        
    def logout(self):
        logout_button = self.driver.find_element("xpath", "//span[text()='Logout']")
        logout_button.click()
        logger.info("User logged out")

    def navigate_to_app(self, url):
        self.driver.get(url)

    def login(self, username_field_name, username):
        username_field = self.driver.find_element("id", username_field_name)
        username_field.send_keys(username)
        username_field.send_keys(Keys.RETURN)
        logger.info(f"Tried to login with user {username}")

    def check_login(self):
        time.sleep(1)  # wait for the page to load
        try:
            login_display = self.driver.find_element("xpath", "//*[contains(text(), '{}')]".format("Select A Channel From the Sidebar"))
            return True
            logger.info("Logged in successfully")
        except:
            return False
            logger.error(f"Failed to login")

    def get_available_channels(self):

        channel_elements = self.driver.find_elements("xpath", "//li[@role='menuitem']/span") 
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
        now = datetime.now()
        time = now.strftime("%H:%M:%S")
        message_to_send = message + "| " + time
        message_box.send_keys(message_to_send)
        message_box.send_keys(Keys.RETURN)

    def upload_file(self, file_path):
        file_input = self.driver.find_element("css selector", "input[type='file']")
        file_input.send_keys(file_path)

    def get_user_statuses_in_channel(self):
        user_elements = self.driver.find_elements("xpath", "//li[@class='ant-list-item']")
        user_statuses = {}
        for user_element in user_elements:
            username = user_element.find_element("xpath", ".//h4[@class='ant-list-item-meta-title']/span").text
            status = user_element.find_element("xpath", ".//div[@class='ant-list-item-meta-description']/span").text
            user_statuses[username] = status
        return user_statuses
    
    def get_messages(self, channel):
        self.select_channel(channel)
        messages = self.driver.find_elements("xpath", "//div[@id='message-bubble']")
        channel_messages = [mess.text for mess in messages] 
        return channel_messages
    
    def get_throughput(self): 
        leave_channel_button = self.driver.find_element("xpath", f"//span[text()='Measure']")
        leave_channel_button.click()
        time.sleep(3)

        upload_speed_element = self.driver.find_element("xpath", "//div[article/text()='Upload']/article[2]")
        download_speed_element = self.driver.find_element("xpath", "//div[article/text()='Download']/article[2]")

        upload_speed = upload_speed_element.text
        download_speed = download_speed_element.text

        logger.info(f"Upload speed: {upload_speed}")
        logger.info(f"Download speed: {download_speed}")

        return upload_speed,download_speed

    def test_create_channel(self):
        try:
            count = 0
            while True:
                available_channels = self.get_available_channels()
                channel_to_create = CONFIG['channel_name'] + "_" + str(count)
                if channel_to_create in available_channels: 
                    count += 1
                else:
                    CONFIG['channel_name'] = channel_to_create
                    self.create_channel(CONFIG['channel_name'])
                    break
            self.assertIn(CONFIG['channel_name'], self.get_available_channels())
            logger.info(f"Successfully created a channel named {CONFIG['channel_name']}")
        except Exception as e:
            logger.error(f"Failed to create channel named {CONFIG['channel_name']}")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def test_send_message(self):
        try:
            available_channels = self.get_available_channels()
            if CONFIG["created_channel"] in available_channels:
                self.select_channel(CONFIG["created_channel"])
            else:
                self.create_channel(CONFIG["created_channel"])
            self.send_message(CONFIG['message'])
            logger.info(f"Successfully sent messages to channel {CONFIG['created_channel']}")
        except Exception as e:
            logger.error(f"Failed to send message to channel named {CONFIG['created_channel']}")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def test_upload_file(self):
        try:
            available_channels = self.get_available_channels()
            if CONFIG["created_channel"] in available_channels:
                self.select_channel(CONFIG["created_channel"])
            else:
                self.create_channel(CONFIG["created_channel"])
            self.upload_file(CONFIG['file_path'])
            logger.info(f"Successfully uploaded file to channel {CONFIG['created_channel']}")
            self.upload_file(CONFIG['large_file_path'])
            logger.info(f"Successfully large file to channel {CONFIG['created_channel']}")
        except Exception as e:
            logger.error(f"Failed to send file to channel named {CONFIG['created_channel']}")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise

    def test_chatting(self):
        try:
            logger.info("Starting chat testing")
            available_channels = self.get_available_channels()
            if CONFIG["testing_channel"] in available_channels:
                self.select_channel(CONFIG["testing_channel"])
            else:
                self.create_channel(CONFIG["testing_channel"])
            self.send_message("Starting chatting test")
            test_end_message = "End"
            while True:
                self.send_message("Just testing.")
                messages = self.get_messages(CONFIG["testing_channel"])
                if test_end_message in messages:
                    self.send_message("Ending chat testing.")
                    break
                time.sleep(1)
            logger.info("Chat test successful")
        except Exception as e:
            logger.error(f"Failed chat testing.")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise  

    def test_get_user_status_in_channels(self):
        try:
            available_channels = self.get_available_channels()
            if CONFIG["testing_channel"] in available_channels:
                self.select_channel(CONFIG["testing_channel"])
            else:
                self.create_channel(CONFIG["testing_channel"])
            users_statuses = self.get_user_statuses_in_channel() 
            users = list(users_statuses.keys())
            logger.info(f"Successfully read user statuses in channel {CONFIG['testing_channel']}")
            logger.info(f"Users are {users}")
        except Exception as e:
            logger.error(f"Failed to get status info from channel {CONFIG['testing_channel']}")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise 
        
    def test_throughput(self):
        try:
            upload_speed, download_speed = self.get_throughput()
            upload_speed, download_speed = self.get_throughput()
            upload_speed, download_speed = self.get_throughput()
            logger.info("Successfully tested speed measurement")
        except Exception as e:
            logger.error(f"Failed testing throughput")
            logger.error(f"Test failed: {e}")
            self.tearDownClass()
            raise 
            

if __name__ == "__main__":
    unittest.main()
