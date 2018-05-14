from backend import *

if __name__ == "__main__":
	application.debug = False
	application.run(host="10.3.4.69", port=5000, threaded=True)