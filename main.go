package main

import (
	"time"

	"github.com/verik-systems/zinno-hsd/client"
)

func main() {
	interval := 10

	client := client.HsdClient{
		ServerURL:     "http://localhost:1234/heartbeat",
		Authorization: "super secret",
		Interval:      interval,
		Command: client.Command{
			Interval:    interval,
			Service:     "talkback",
			ServiceHost: "foo.bar:12345",
		},
	}

	client.Start()

	time.Sleep(time.Minute * 10)
}
