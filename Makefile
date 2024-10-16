-include .env

.PHONY: tunnel
tunnel:
	cloudflared --config tunnel/${USER}.yml tunnel run