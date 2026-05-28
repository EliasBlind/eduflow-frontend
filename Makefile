PROTO_DIR = proto
SRC_DIR = src/api/gen
PLUGIN = $(shell pwd)/node_modules/.bin/protoc-gen-ts_proto

TS_PROTO_FLAGS = --ts_proto_opt=esModuleInterop=true,outputClientImpl=grpc-web,env=browser

.PHONY: gen clean gen-journal gen-sso

gen: gen-journal gen-sso

gen-journal:
	@mkdir -p $(SRC_DIR)/journal
	bunx protoc \
		--plugin=protoc-gen-ts_proto=$(PLUGIN) \
		--proto_path=$(PROTO_DIR)/journal/v1 \
		--proto_path=$(PROTO_DIR) \
		--ts_proto_out=$(SRC_DIR)/journal \
		$(TS_PROTO_FLAGS) \
		$(PROTO_DIR)/journal/v1/*.proto
	@echo "✓ Journal proto generated in $(SRC_DIR)/journal"

gen-sso:
	@mkdir -p $(SRC_DIR)/sso
	bunx protoc \
		--plugin=protoc-gen-ts_proto=$(PLUGIN) \
		--proto_path=$(PROTO_DIR)/sso/v1 \
		--proto_path=$(PROTO_DIR) \
		--ts_proto_out=$(SRC_DIR)/sso \
		$(TS_PROTO_FLAGS) \
		$(PROTO_DIR)/sso/v1/*.proto
	@echo "✓ SSO proto generated in $(SRC_DIR)/sso"

clean:
	rm -rf $(SRC_DIR)/journal/*
	rm -rf $(SRC_DIR)/sso/*