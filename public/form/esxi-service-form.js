(function(params) {

    var commandComboBox = Cla.ui.comboBox({
        name: 'command',
        fieldLabel: 'Command',
        data: [
            ['list','list'],
            ['start','start'],
            ['stop','stop'],
            ['restart','restart'],
            ['suspend','suspend'],
            ['status','status'],
            ['register','register'],
            ['delete','delete'],
            ['unregister','unregister'],
            ['snapshot','snapshot']
        ],
        value: params.data.command || ['list'],
        allowBlank: false,
        anchor: '100%',
        singleMode: true
    });

    var actionComboBox = Cla.ui.comboBox({
        name: 'snapshotAction',
        fieldLabel: 'Action',
        data: [
            ['get','get'],
            ['create','create'],
            ['remove','remove'],
            ['revert','revert']
        ],
        value: params.data.snapshotAction || ['get'],
        allowBlank: true,
        singleMode: true,
        width: 400,
        hidden: (params.data.command != 'snapshot')
    });

    var esxiServerCombo = Cla.ui.ciCombo({
        name: 'esxiServer',
        class: 'generic_server',
        fieldLabel: _('Server'),
        value: params.data.esxiServer || '',
        width: 400,
        allowBlank: true,
        with_vars: 1,
        hidden: (params.data.command != 'list')
    });

    var vmComboBox = Cla.ui.ciCombo({
        name: 'vmId',
        class: 'esxiVms',
        fieldLabel: _('Virtual Machine'),
        value: params.data.vmId || '',
        width: 400,
        allowBlank: true,
        with_vars: 1,
        hidden: !(params.data.command != 'list' && params.data.command != 'register')
    });

    var filePathTextField = Cla.ui.textField({
        name: 'filePath',
        fieldLabel: _('Vmx file path'),
        value: params.data.filePath,
        allowBlank: true,
        hidden: (params.data.command != 'register')
    });

    var snapshotNameTextField = Cla.ui.textField({
        name: 'snapshotName',
        fieldLabel: _('Snapshot name'),
        value: params.data.snapshotName,
        allowBlank: true,
        hidden: (params.data.command != 'snapshot')
    });

    var snapshotIdTextField = Cla.ui.textField({
        name: 'snapshotId',
        fieldLabel: _('Snapshot ID'),
        value: params.data.snapshotId,
        allowBlank: true,
        hidden: (params.data.command != 'snapshot')
    });

    commandComboBox.on('addItem', function() {
        var v = commandComboBox.getValue();
        var actionMode = actionComboBox.getValue();
        if (v == 'list') {
            esxiServerCombo.show();
            vmComboBox.hide();
            filePathTextField.hide();
            actionComboBox.hide();
            actionComboBox.allowBlank = true;
            esxiServerCombo.allowBlank = false;
            vmComboBox.allowBlank = true;
            filePathTextField.allowBlank = true;
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.hide();
            snapshotIdTextField.allowBlank = true;
        } else if (v == 'register') {
            esxiServerCombo.show();
            vmComboBox.hide();
            filePathTextField.show();
            actionComboBox.hide();
            actionComboBox.allowBlank = true;
            esxiServerCombo.allowBlank = false;
            vmComboBox.allowBlank = true;
            filePathTextField.allowBlank = false;
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.hide();
            snapshotIdTextField.allowBlank = true;
        } else if (v == 'snapshot') {
            esxiServerCombo.hide();
            vmComboBox.show();
            filePathTextField.hide();
            actionComboBox.show();
            actionComboBox.allowBlank = false;
            esxiServerCombo.allowBlank = true;
            vmComboBox.allowBlank = false;
            filePathTextField.allowBlank = true;
            if (actionMode == 'get') {
                snapshotNameTextField.hide();
                snapshotNameTextField.allowBlank = true;
                snapshotIdTextField.hide();
                snapshotIdTextField.allowBlank = true;
            } else if (actionMode == 'create') {
                snapshotNameTextField.show();
                snapshotNameTextField.allowBlank = false;
                snapshotIdTextField.hide();
                snapshotIdTextField.allowBlank = true;
            } else if (actionMode == 'remove') {
                snapshotNameTextField.hide();
                snapshotNameTextField.allowBlank = true;
                snapshotIdTextField.show();
                snapshotIdTextField.allowBlank = false;
            } else {
                snapshotNameTextField.hide();
                snapshotNameTextField.allowBlank = true;
                snapshotIdTextField.show();
                snapshotIdTextField.allowBlank = false;
            }
        } else {
            esxiServerCombo.hide();
            vmComboBox.show();
            filePathTextField.hide();
            actionComboBox.hide();
            actionComboBox.allowBlank = true;
            esxiServerCombo.allowBlank = true;
            vmComboBox.allowBlank = false;
            filePathTextField.allowBlank = true;
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.hide();
            snapshotIdTextField.allowBlank = true;
        }
    });


    actionComboBox.on('addItem', function() {
        var v = actionComboBox.getValue();
        if (v == 'get') {
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.hide();
            snapshotIdTextField.allowBlank = true;
        } else if (v == 'create') {
            snapshotNameTextField.show();
            snapshotNameTextField.allowBlank = false;
            snapshotIdTextField.hide();
            snapshotIdTextField.allowBlank = true;
        } else if (v == 'remove') {
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.show();
            snapshotIdTextField.allowBlank = false;
        } else {
            snapshotNameTextField.hide();
            snapshotNameTextField.allowBlank = true;
            snapshotIdTextField.show();
            snapshotIdTextField.allowBlank = false;
        }
    });

    var errorBox = Cla.ui.errorManagementBox({
        errorTypeName: 'errors',
        errorTypeValue: params.data.errors || 'fail',
        rcOkName: 'rcOk',
        rcOkValue: params.data.rcOk,
        rcWarnName: 'rcWarn',
        rcWarnValue: params.data.rcWarn,
        rcErrorName: 'rcError',
        rcErrorValue: params.data.rcError,
        errorTabsValue: params.data
    })

    var panel = Cla.ui.panel({
        layout: 'form',
        items: [
            commandComboBox,
            actionComboBox,
            esxiServerCombo,
            vmComboBox,
            filePathTextField,
            snapshotNameTextField,
            snapshotIdTextField,
            errorBox
        ]
    });

    return panel;
})