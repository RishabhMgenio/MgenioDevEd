/**
 * Controller class for handling PDF to text conversion and updating record fields on the record page.
 * This class provides methods to retrieve updateable fields for a given object and to process field arrays for record display.
 */
public with sharing class CreatePdfsController {

    /**
     * Retrieves a map of accessible objects with their API names and labels.
     * 
     * @return Map<String, String> A map containing object API names as keys and object labels as values.
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> fetchAllObjectList() {
        Map<String, String> mapOfAccessibleObjects = new Map<String, String>();

        for (Schema.SObjectType objectType : Schema.getGlobalDescribe().values()) {
            Schema.DescribeSObjectResult objDescribe = objectType.getDescribe();
            if (objDescribe.isAccessible()) {
                String name = objDescribe.getLocalName();
                String label = objDescribe.getLabel();
                mapOfAccessibleObjects.put(name, label);
            }
        }

        return mapOfAccessibleObjects;
    }

    /**
     * Retrieves a map of accessible fields for a given object.
     * 
     * @param strObjectName String The API name of the object for which to retrieve accessible fields.
     * @return Map<String, String> A map containing field API names as keys and field labels as values.
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> fetchAllFieldList(String strObjectName) {
        Map<String, String> mapOfFields = new Map<String, String>();

        if (Schema.getGlobalDescribe().containsKey(strObjectName)) {
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(strObjectName).getDescribe();

            for (Schema.SObjectField field : objDescribe.fields.getMap().values()) {
                if (field.getDescribe().isAccessible()) {
                    mapOfFields.put(field.getDescribe().getName(), field.getDescribe().getName());
                }
            }
        }

        return mapOfFields;
    }

    /**
     * Retrieves a map of accessible fields for a given object, specifically for record page usage.
     * 
     * @param strObjectName String The API name of the object for which to retrieve accessible fields.
     * @return Map<String, String> A map containing field API names as keys and field labels as values.
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> fetchAllFieldListforRecordPage(String strObjectName) {
        Map<String, String> mapOfFields = new Map<String, String>();

        if (Schema.getGlobalDescribe().containsKey(strObjectName)) {
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(strObjectName).getDescribe();

            for (Schema.SObjectField field : objDescribe.fields.getMap().values()) {
                if (field.getDescribe().isAccessible()) {
                    mapOfFields.put(field.getDescribe().getName(), field.getDescribe().getName());
                }
            }
        }

        return mapOfFields;
    }

    /**
     * Processes an array of selected field names, retrieves corresponding record data, and builds a formatted string representation of the record.
     * 
     * @param stringArray List<String> List of selected field names.
     * @param objectApiName String The API name of the object containing the record.
     * @param recordId String The Id of the record to retrieve data for.
     * @return String A formatted string representation of the record data.
     */
    @AuraEnabled
    public static String processArray(List<String> stringArray, String objectApiName, String recordId) {
        try {
            if (!areFieldsAccessible(stringArray, objectApiName)) {
                return 'Some fields are not accessible.';
            }
            
            String result = String.join(stringArray, ', ');
            String queryString = 'SELECT ' + result + ' FROM ' + objectApiName + ' WHERE Id = :recordId LIMIT 1';

            List<SObject> objList = Database.query(queryString); //NOPMD 
 
            if (objList != null && !objList.isEmpty()) {
                SObject obj = objList[0];
                String recordData = buildRecordString(obj, stringArray);
                return recordData;
            } else {
                return 'No records found for the specified Id: ' + recordId;
            }
        } catch (Exception e) {
            return 'Error processing fields: ' + e.getMessage();
        }
    }

    /**
     * Checks if the specified fields are accessible for the given object.
     * 
     * @param fieldNames List<String> List of field names to check accessibility.
     * @param objectApiName String The API name of the object.
     * @return Boolean True if all fields are accessible; otherwise, false.
     */
    private static Boolean areFieldsAccessible(List<String> fieldNames, String objectApiName) {
        if (Schema.getGlobalDescribe().containsKey(objectApiName)) {
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();

            for (String fieldName : fieldNames) {
                if (!objDescribe.fields.getMap().containsKey(fieldName) || !objDescribe.fields.getMap().get(fieldName).getDescribe().isAccessible()) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Builds a formatted string representation of the record data based on the selected fields.
     * 
     * @param obj SObject The record object.
     * @param selectedFields List<String> List of selected field names.
     * @return String A formatted string representation of the record data.
     */
    private static String buildRecordString(SObject obj, List<String> selectedFields) {
        String recordData = '';
        for (String fieldName : selectedFields) {
            Object fieldValue = obj.get(fieldName);

            if (fieldName.endsWith('__c')) {
                fieldName = fieldName.replace('__c', '').replace('_', ' ');
            }
            recordData += fieldName + ': ' + String.valueOf(fieldValue) + '\n\n\n';
        }

        return recordData;
    }
}