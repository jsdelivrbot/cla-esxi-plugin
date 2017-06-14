var reg = require("cla/reg");
reg.register('service.esxi.start', {
    name: 'Manage Esxi VmWare VM',
    icon: '/plugin/cla-esxi-plugin/icon/esxi.svg',
    form: '/plugin/cla-esxi-plugin/form/esxi-service-form.js',
    handler: function(ctx, params) {

        var ci = require("cla/ci");
        var reg = require('cla/reg');
        var log = require('cla/log');

        var server,
            command,
            fullCommand,
            vmCi,
            vmId,
            parsedResponse;
        var snapshotParameter = "";
        var esxiServer = params.esxiServer;
        var vmCiId = params.vmId;
        var filePath = params.filePath || "";
        var commandOption = params.command || "";
        var snapshotAction = params.snapshotAction || "";
        var snapshotName = params.snapshotName || "";
        var snapshotId = params.snapshotId || "";
        var errors = params.errors || "fail";

        if (!esxiServer) {
            log.fatal("Server CI doesn't exist");
        }
        if (!vmCiId) {
            log.fatal("VM CI doesn't exist");
        }

        if (commandOption == "custom") {
            server = esxiServer;
            command = options;
        } else if (commandOption == "list") {
            server = esxiServer;
            command = "vmsvc/getallvms";
        } else if (commandOption == "register") {
            server = esxiServer;
            command = "solo/registervm " + filePath;
        } else {
            vmCi = ci.findOne({
                mid: vmCiId + ""
            });
            if (!vmCi) {
                log.fatal("VM CI doesn't exist");
            }
            server = vmCi.server;
            if (!server) {
                log.fatal("Server CI doesn't exist");
            }
            vmId = vmCi.vmId;
            if (vmId < 1) {
                log.fatal("No virtual machine selected")
            }
            if (commandOption == "start") {
                command = "vmsvc/power.on ";
            } else if (commandOption == "stop") {
                command = "vmsvc/power.off ";
            } else if (commandOption == "suspend") {
                command = "vmsvc/power.suspend ";
            } else if (commandOption == "status") {
                command = "vmsvc/power.getstate ";
            } else if (commandOption == "unregister") {
                command = "vmsvc/unregister  ";
            } else if (commandOption == "delete") {
                command = "vmsvc/destroy ";
            } else if (commandOption == "restart") {} else {
                if (snapshotAction == "get") {
                    command = "vmsvc/snapshot.get ";
                } else if (snapshotAction == "create") {
                    command = "vmsvc/snapshot.create ";
                    snapshotParameter = " " + snapshotName;
                } else if (snapshotAction == "remove") {
                    command = "vmsvc/snapshot.remove ";
                    snapshotParameter = " " + snapshotId;
                } else if (snapshotAction == "revert") {
                    command = "vmsvc/snapshot.revert ";
                    snapshotParameter = " " + snapshotId + " suppressPowerOn";
                } else {
                    log.fatal("No option selected");
                }
            }
            command = command + vmId + snapshotParameter;
        }
        fullCommand = "vim-cmd " + command;

        function remoteCommand(params, command, server, errors) {
            var output = reg.launch('service.scripting.remote', {
                name: 'esxi task',
                config: {
                    errors: errors,
                    server: server,
                    path: command,
                    output_error: params.output_error,
                    output_warn: params.output_warn,
                    output_capture: params.output_capture,
                    output_ok: params.output_ok,
                    meta: params.meta,
                    rc_ok: params.rcOk,
                    rc_error: params.rcError,
                    rc_warn: params.rcWarn
                }
            });
            return output;
        }

        var commandLaunch;
        var response = {};
        var validOptions = ["list", "status", "unregister", "snapshot"];
        var manageOptions = ["start", "stop", "restart", "suspend"];

        if (validOptions.indexOf(commandOption) >= 0) {
            commandLaunch = remoteCommand(params, fullCommand, server, errors);
            if (commandOption == "unregister" || commandOption == "delete") {
                vmCiId = vmCiId + "";
                ci.delete(vmCiId);
            }
        } else if (manageOptions.indexOf(commandOption) >= 0) {
            commandLaunch = remoteCommand(params, "vim-cmd vmsvc/power.getstate " + vmId, server, params.errors);
            var parseIndex = commandLaunch.output.indexOf("Retrieved runtime info");
            parsedResponse = commandLaunch.output.substring(parseIndex + 23, commandLaunch.output.length - 1);
            response = commandLaunch.output;
            if (commandOption == "start" && (parsedResponse == "Suspended" || parsedResponse == "Powered off")) {
                log.debug("Starting virtual machine " + vmId, response);
                commandLaunch = remoteCommand(params, fullCommand, server, errors);
            } else if (commandOption == "start" && parsedResponse == "Powered on") {
                log.warn("Virtual machine already started", response);
            }
            if (commandOption == "stop" && (parsedResponse == "Suspended" || parsedResponse == "Powered on")) {
                log.debug("Stopping virtual machine " + vmId, response);
                commandLaunch = remoteCommand(params, fullCommand, server, errors);
            } else if (commandOption == "stop" && parsedResponse == "Powered off") {
                log.warn("Virtual machine already stopped", response);
            }
            if (commandOption == "restart" && (parsedResponse == "Suspended" || parsedResponse == "Powered on")) {
                log.debug("Restarting virtual machine " + vmId, response, response);
                commandLaunch = remoteCommand(params, "vim-cmd vmsvc/power.off " + vmId, server, errors);
                commandLaunch = remoteCommand(params, "vim-cmd vmsvc/power.on " + vmId, server, errors);
            } else if (commandOption == "restart" && parsedResponse == "Powered off") {
                log.warn("Virtual machine already stopped. Starting virtual machine.", response);
                commandLaunch = remoteCommand(params, "vim-cmd vmsvc/power.on " + vmId, server, errors);
            }
            if (commandOption == "suspend" && parsedResponse == "Powered on") {
                log.debug("Suspending virtual machine " + vmId);
                commandLaunch = remoteCommand(params, fullCommand, server, errors);
            } else if (commandOption == "suspend" && parsedResponse == "Suspended") {
                log.warn("Virtual machine already Suspended", response);
            } else if (commandOption == "suspend" && parsedResponse == "Powered off") {
                log.error("Virtual machine not started, can't be suspended.", response)
            }
        } else if (commandOption == "register") {
            commandLaunch = remoteCommand(params, fullCommand, server, errors);

            var initindex = filePath.lastIndexOf("/");
            var lastIndex = filePath.indexOf(".vmx");
            var esxiCiName = filePath.substring(initindex + 1, lastIndex) + "-VM";

            var esxiCi = ci.getClass('esxiVms');
            var newVmCi = new esxiCi({
                name: esxiCiName,
                server: [server],
                vmId: commandLaunch.output
            });
            var newVmId = newVmCi.save();
            response.mid = newVmId;
            response.output = commandLaunch.output;
            log.info("Virtual machine CI save with the MID: " + newVmId);
            log.info("Task " + commandOption + " finished.", response)
            return response;
        }

        response = commandLaunch.output;
        log.info("Task " + commandOption + " finished.", response)

        return response;

    }
});