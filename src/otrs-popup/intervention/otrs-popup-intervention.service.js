angular.module("ovh-angular-otrs")
    .service("OtrsPopupInterventionService", function ($q, OvhHttp) {
        "use strict";

        var self = this;

        var cacheServer = {
            all: "UNIVERS_DEDICATED_SERVER"
        };

        self.sendDiskReplacement = function (serviceName, disk) {
            var diskToSend = _.assign({}, disk);

            if (!diskToSend.comment) {
                diskToSend.comment = "No message";
            }

            return OvhHttp.post("/dedicated/server/{serviceName}/support/replace/hardDiskDrive", {
                rootPath: "apiv6",
                urlParams: {
                    serviceName: serviceName
                },
                data: diskToSend
            });
        };

        self.getServerInterventionInfo = function (serviceName) {
            return $q.all({
                serverInfo: getServerInfo(serviceName),
                hardwareInfo: getHardwareInfo(serviceName)
            }).then(function (results) {
                return {
                    canHotSwap: canHotSwap(results.serverInfo, results.hardwareInfo),
                    hasMegaRaid: hasMegaRaidCard(results.hardwareInfo),
                    slotInfo: slotInfo(results.serverInfo, results.hardwareInfo)
                };
            });
        };

        function getServerInfo (serviceName) {
            return OvhHttp.get("/dedicated/server/{serviceName}", {
                rootPath: "apiv6",
                urlParams: {
                    serviceName: serviceName
                },
                cache: cacheServer.all
            });
        }

        function getHardwareInfo (serviceName) {
            return OvhHttp.get("/dedicated/server/{serviceName}/specifications/hardware", {
                rootPath: "apiv6",
                urlParams: {
                    serviceName: serviceName
                }
            });
        }

        function canHotSwap (serverInfo, hardwareInfo) {
            return serverInfo.commercialRange.toUpperCase() === "HG" && _.includes(["2U", "4U"], hardwareInfo.formFactor.toUpperCase());
        }

        function hasMegaRaidCard (hardwareInfo) {
            return _.some(hardwareInfo.diskGroups, { raidController: "MegaRaid" });
        }

        function slotInfo (serverInfo, hardwareInfo) {
            var canUseSlotId = serverInfo.commercialRange.toUpperCase() === "HG";
            var slotsCount = hardwareInfo.formFactor && hardwareInfo.formFactor.toUpperCase() === "4U" ? 24 : 12;

            return {
                canUseSlotId: canUseSlotId,
                slotsCount: slotsCount
            };
        }
    });
