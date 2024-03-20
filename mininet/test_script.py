from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time

class TestMyWebApp:
    def __init__(self, driver):
        self.driver = driver

    def navigate_to_app(self, url):
        self.driver.get(url)

    def login(self, username_field_name, username):
        try:
            username_field = self.driver.find_element("id", username_field_name)
            username_field.send_keys(username)
            username_field.send_keys(Keys.RETURN)
            print("Logged in")
        except Exception as e:
            print(f"Login failed: {e}")

    def check_login(self, username):
        try:
            time.sleep(5)  # wait for the page to load
            user_display = self.driver.find_element("xpath", "//*[contains(text(), '{}')]".format(username))
            assert username in user_display.text
            print("Login check passed")
        except Exception as e:
            print(f"Login check failed: {e}")

    def get_available_channels(self):
        try:
            # find all the channel elements
            channel_elements = self.driver.find_elements("xpath", "//li[@role='menuitem']/span")
            
            # get the name of each channel
            channel_names = [channel.text for channel in channel_elements]
            
            return channel_names
        except Exception as e:
            print(f"Failed to get available channels: {e}")
            return []

    def create_channel(self, channel_name):
        try:
            # check if the channel already exists
            if channel_name in self.get_available_channels():
                print(f"Channel '{channel_name}' already exists")
                return

            # find the "Create Channel" button and click it
            create_channel_button = self.driver.find_element("xpath", "//span[text()='Create Channel']")
            create_channel_button.click()
            time.sleep(2)  # wait for the prompt to appear

            # enter the channel name in the prompt
            channel_name_prompt = self.driver.find_element("css selector", "input.ant-input.css-dev-only-do-not-override-1c3asd8.ant-input-outlined")
            channel_name_prompt.send_keys(channel_name)
            channel_creaton_ok_button = self.driver.find_element("xpath", "//span[text()='OK']")
            channel_creaton_ok_button.click()
            time.sleep(2)

            print("Channel created")
        except Exception as e:
            print(f"Channel creation failed: {e}")


    def send_message(self, message):
        try:
            message_box = self.driver.find_element("css selector", "input[style='flex-grow: 1; margin-left: 1rem;']")
            message_box.send_keys(message)
            message_box.send_keys(Keys.RETURN)
            print("Message sent")
        except Exception as e:
            print(f"Message sending failed: {e}")

    def upload_file(self, file_path):
        try:
            file_input = self.driver.find_element("css selector", "input[type='file']")
            file_input.send_keys(file_path)
            print("File uploaded")
        except Exception as e:
            print(f"File upload failed: {e}")

    def close_browser(self):
        self.driver.quit()
        print("Browser closed")

# set up Firefox options
options = Options()
#options.add_argument('-headless')  # use this line to set headless mode

# set up Firefox service
service = Service(executable_path='/home/qtio/Downloads/apps/geckodrivers/geckodriver')

# create a new Firefox browser instance with options
driver = webdriver.Firefox(service=service, options=options)

# create an instance of the test class
test = TestMyWebApp(driver)

# perform the actions
uname='test_u_7'
test.navigate_to_app('http://10.0.1.2:3000')
test.login('username', uname )
test.check_login(uname)
test.create_channel('testing_3')
test.send_message('Test message')
test.upload_file('/home/qtio/Documents/koulu/internet_protocols/Collaboration_tool_H/mininet/ping_file.png')

# close the browser
test.close_browser()
