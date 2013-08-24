# NAME
LIVR.Validator - Lightweight validator supporting Language Independent Validation Rules Specification (LIVR)

# SYNOPSIS
Common usage:

    var LIVR = require('LIVR');
    
    var validator = new LIVR.Validator({
        name:      'required',
        email:     [ 'required', 'email' ],
        gender:    { one_of : [['male', 'female']] },
        phone:     { max_length : 10 },
        password:  [ 'required', {min_length : 10} ],
        password2: { equal_to_field : 'password' }
    });
    
    var validData = validator.validate(userData);
    
    if (validData) {
        saveUser(validData);
    } else {
        console.log('errors', validator.getErrors());
    }
    


You can use filters separately or can combine them with validation:

    var validator = new LIVR.Validator({
        email: [ 'required', 'trim', 'email', 'to_lc' ]
    });
    


Feel free to register your own rules:

    var validator = new LIVR.Validator({
        password: ['required', 'strong_password']
    });
    
    validator.registerRules( 'strong_password', function() {
        return function(value) {
            // We already have "required" rule to check that the value is present
            if ( value === undefined || value === null || value === '' ) return;
    
            if ( value.length < 6 ) {
                return 'WEAK_PASSWORD'
            }
        }
    } );


# DESCRIPTION
See https://github.com/koorchik/LIVR for details.

Features:

 * Rules are declarative and language independent
 * Any number of rules for each field
 * Return together errors for all fields
 * Excludes all fields that do not have validation rules described
 * Has possibility to validatate complex hierarchical structures
 * Easy to describe and undersand rules
 * Returns understandable error codes(not error messages)
 * Easy to add own rules
 * Rules are be able to change results output ("trim", "nested_object", for example)
 * Multipurpose (user input validation, configs validation, contracts programming etc)

# INSTALL

Use npm for nodejs. For browser you can find browserified versions in "dist" folder.

# CLASS METHODS

## LIVR.Validator.registerDefaultRules({"rule_name": ruleBuilder })
ruleBuilder - is a function reference which will be called for building single rule validator.

    LIVR.Validator.registerDefaultRules( "my_rule": function(arg1, arg2, arg3, ruleBuilders) {
        // ruleBuilders - are rules from original validator 
        // to allow you create new validator with all supported rules
        // var validator = new LIVR.Validator->new(livr).register_rules(ruleBuilders).prepare();
    
        return function(value, allValues, outputArr) {            
            if (notValid) {
                return "SOME_ERROR_CODE";
            }
            else {
                
            }
        }
    });

Then you can use "my_rule" for validation:
    
    {
        name1: 'my_rule' // Call without parameters
        name2: { 'my_rule': arg1 } // Call with one parameter.
        name3: { 'my_rule': [arg1] } // Call with one parameter.
        name4: { 'my_rule': [ arg1, arg2, arg3 ] } // Call with many parameters.
    }

Here is "max_number" implemenation:

    function maxNumber(maxNumber) {
        return function(value) {
            // We do not validate empty fields. We have "required" rule for this purpose
            if (value === undefined || value === null || value === '' ) return;
    
            // return error message
            if ( value > maxNumber ) return 'TOO_HIGH';
        };
    };
    LIVR.Validator.registerDefaultRules({ "max_number": maxNumber });

All rules for the validator are equal. It does not distinguish "required", "list_of_different_objects" and "trim" rules. So, you can extend validator with any rules you like.

## LIVR.Validator.getDefaultRules({"rule_name": ruleBuilder });
returns object containing all default ruleBuilders for the validator. You can register new rule or update existing one with "registerRules" method.

# OBJECT METHODS

## validator.validate(input)
Validates user input. On success returns validData (contains only data that has described validation rules). On error return false.

    my validaData = validator.validate(input)

    if (validData) {
        // use validData
    } else {
        var errors = validator.getErrors();
    }

## validator.getErrors()
Returns errors object.

   {
        "field1": "ERROR_CODE",
        "field2": "ERROR_CODE",
        ...
    }

For example:

    {
        "country":  "NOT_ALLOWED_VALUE",
        "zip":      "NOT_POSITIVE_INTEGER",
        "street":   "REQUIRED",
        "building": "NOT_POSITIVE_INTEGER"
    }

## validator.registerRules({"rule_name": ruleBuilder})

ruleBuilder - is a function reference which will be called for building single rule validator.

See "LIVR.Validator.registerDefaultRules" for rules examples.

## validator.getRules()
returns object containing all ruleBuilders for the validator. You can register new rule or update existing one with "registerRules" method.

# AUTHOR
koorchik (Viktor Turskyi)

# BUGS
Please report any bugs or feature requests to Github https://github.com/koorchik/js-validator-livr

# LICENSE AND COPYRIGHT

Copyright 2012 Viktor Turskyi.

This program is free software; you can redistribute it and/or modify it under the terms of the the Artistic License (2.0). You may obtain a copy of the full license at:

http://www.perlfoundation.org/artistic_license_2_0

Any use, modification, and distribution of the Standard or Modified Versions is governed by this Artistic License. By using, modifying or distributing the Package, you accept this license. Do not use, modify, or distribute the Package, if you do not accept this license.

If your Modified Version has been derived from a Modified Version made by someone other than you, you are nevertheless required to ensure that your Modified Version complies with the requirements of this license.

This license does not grant you the right to use any trademark, service mark, tradename, or logo of the Copyright Holder.

This license includes the non-exclusive, worldwide, free-of-charge patent license to make, have made, use, offer to sell, sell, import and otherwise transfer the Package with respect to any patent claims licensable by the Copyright Holder that are necessarily infringed by the Package. If you institute patent litigation (including a cross-claim or counterclaim) against any party alleging that the Package constitutes direct or contributory patent infringement, then this Artistic License to you shall terminate on the date that such litigation is filed.

Disclaimer of Warranty: THE PACKAGE IS PROVIDED BY THE COPYRIGHT HOLDER AND CONTRIBUTORS "AS IS' AND WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES. THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT ARE DISCLAIMED TO THE EXTENT PERMITTED BY YOUR LOCAL LAW. UNLESS REQUIRED BY LAW, NO COPYRIGHT HOLDER OR CONTRIBUTOR WILL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING IN ANY WAY OUT OF THE USE OF THE PACKAGE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



