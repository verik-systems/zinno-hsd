package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/verik-systems/zinno-hsd/client"
)

type hbConfig struct {
	Heartbeat            bool
	HeartbeatHost        string
	HeartbeatToken       string
	HeartbeatServiceHost string
}

var hb hbConfig

func init() {
	var configFileName = flag.String("config", "config.json", "the configuration file")

	flag.Parse()

	jsonFile, err := os.Open(*configFileName)

	// if we os.Open returns an error then handle it
	if err != nil {
		fmt.Println(err)
	}
	// defer the closing of our jsonFile so that we can parse it later on
	defer jsonFile.Close()

	// read our opened xmlFile as a byte array.
	byteValue, _ := ioutil.ReadAll(jsonFile)

	// we initialize our Users array

	// we unmarshal our byteArray which contains our
	// jsonFile's content into 'users' which we defined above
	json.Unmarshal(byteValue, &hb)

	log.Println("hb", hb)
}

func main() {
	client := client.HsdClient{
		ServerURL:     hb.HeartbeatHost,
		Authorization: hb.HeartbeatToken,
		Interval:      10,
		Command: client.Command{
			Interval:    5,
			Service:     "talkback",
			ServiceHost: hb.HeartbeatServiceHost,
		},
	}
	client.Start()
	time.Sleep(time.Minute * 5)
}
