#$Id$

import sys
import os
import io
import json
globalKeys = {}

def create_dir(dir_name):
    if not os.path.exists(dir_name):
        try:
            os.makedirs(dir_name)
        except OSError as exc:
            if exc.errno != errno.EEXIST:
                raise

def list_dir(base_dir):
    files_in_dir = list()
    for (dir_path, dir_names, file_names) in os.walk(base_dir):
        files_in_dir += [os.path.join(dir_path, fileObj) for fileObj in file_names]
    return files_in_dir


def writeFile(fileObj,msg_json_str,final_target_dir):
    filename = os.path.splitext(os.path.basename(fileObj))[0]
    mr_file = os.path.join(final_target_dir, filename[0].lower() + filename[1:] + ".js")
    if isinstance(msg_json_str, bytes):
        msg_json_str = msg_json_str.decode('utf-8')
    msg_json_str = "self.rte_I18n=" + msg_json_str
    with io.open(mr_file, 'w', encoding="utf-8") as f:
        f.write(msg_json_str)
    f.close()

def verifyKeys(fileObj,keyJSON):
	with open(fileObj) as f:
			for line in nonblank_lines(f):
				key = line.split("=",1)
				keyJSON[key[0]] = key[1]


def convertJSON(fileObj):
	output={}
	filename = os.path.basename(fileObj)
	with open(fileObj) as f:
		for line in nonblank_lines(f):
			key = line.split("=",1)
			keyValue = key[0]
			msgValue = key[1]
			data = keyValue.split(".",2)
			moduleKey = data[1]
			msgKey = data[2]
			if moduleKey not in output:
				output[moduleKey] = {}
			temp = output[moduleKey]
			temp[msgKey] = msgValue.strip().encode('ascii').decode('unicode-escape')

	for globalKey, globalValue in globalKeys.items():
		globalKeyParts = globalKey.split(".", 2)
		moduleKey, msgKey = globalKeyParts[1], globalKeyParts[2]
		if moduleKey not in output:
			output[moduleKey] = {}
		temp = output[moduleKey]
		if msgKey not in temp:
			temp[msgKey] = globalValue.strip().encode('ascii').decode('unicode-escape')
		
	output_str =  json.dumps(output)
	return output_str


def calc_json(dir,final_target_dir):
	msg_files = list_dir(dir)
	files_dict = {}
	verifyKeys(dir+"/MessageResources.properties", globalKeys)
	for fileObj in msg_files:
		keyJSON = {}
		verifyKeys(fileObj, keyJSON)
		msg_json_str = convertJSON(fileObj)
		writeFile(fileObj,msg_json_str,final_target_dir)


def nonblank_lines(f):
    for l in f:
        line = l.rstrip()
        if line and line[0]!='#':
        	yield line

if __name__ == '__main__':
	message_dir = sys.argv[1]
	if not os.path.exists(message_dir):
		sys.exit("Invalid message directory provided: " + message_dir)
        

	output_dir = sys.argv[2]
	create_dir(output_dir)
	message_dict = calc_json(message_dir,output_dir)
