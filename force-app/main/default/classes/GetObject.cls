/**
 * Controller class for handling Salesforce object and field retrieval and updating field values.
 * This class provides methods to fetch information about Salesforce objects and fields,
 * as well as update field values dynamically.
 */
public with sharing class GetObject { // NOPMD

    /**
     * Retrieves a map of accessible Salesforce object names and their corresponding labels.
     * 
     * @return Map<String, String> A map containing object names as keys and labels as values.
     * @description Retrieves a map of accessible Salesforce object names and their corresponding labels.
     * 
     */
    @AuraEnabled(cacheable=true)    
    public static Map<String, String> fetchAllObjectList() {
        Map<String, String> mapOfAccessibleObjects = new Map<String, String>();
    
        for (Schema.SObjectType objectType : Schema.getGlobalDescribe().values()) {
            Schema.DescribeSObjectResult objDescribe = objectType.getDescribe();
            if (objDescribe.isAccessible()) {
                String name = String.escapeSingleQuotes(objDescribe.getLocalName()); // Sanitize object name
                String label = String.escapeSingleQuotes(objDescribe.getLabel()); // Sanitize object label
                mapOfAccessibleObjects.put(name, label);
            }
        }
    
        return mapOfAccessibleObjects;
    }

    /**
     * Retrieves a map of accessible fields for a specified object.
     * 
     * @param strObjectName String The API name of the object for which to fetch fields.
     * @return Map<String, String> A map containing field names as keys and labels as values.
     * @description Retrieves a map of accessible fields for a specified object.
     * 
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> fetchAllFieldList(String strObjectName) {
        Map<String, String> mapOfFields = new Map<String, String>();
        
        if (Schema.getGlobalDescribe().containsKey(strObjectName)) {
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(strObjectName).getDescribe();
            
            for (Schema.SObjectField field : objDescribe.fields.getMap().values()) {
                if (field.getDescribe().isUpdateable()) {
                    String fieldName = String.escapeSingleQuotes(field.getDescribe().getName());
                    mapOfFields.put(fieldName, fieldName);
                }
            }
        }
        
        return mapOfFields;
    }

    /**
     * Updates a specified field value for a record.
     * 
     * @param recordId String The Id of the record to update.
     * @param arrayValue String The API name of the field to update.
     * @param objectApiName String The API name of the object containing the field to update.
     * @param finalString String The new value to set for the field.
     * @return String A message indicating the success or failure of the update operation.
     * @description Updates a specified field value for a record.
     * 
     */
    @AuraEnabled
    public static String updateField(String recordId, String arrayValue, String objectApiName, String finalString) { // NOPMD // NOPMD

        try {
            if (!isFieldUpdateable(objectApiName, arrayValue)) {
                return 'The field is not updateable.';
            }
            
            String soqlQuery = 'SELECT Id, ' + arrayValue + ' FROM ' + objectApiName + ' WHERE Id = :recordId LIMIT 1';
            List<SObject> records = Database.query(soqlQuery); // NOPMD // NOPMD
    
            if (records.isEmpty()) {
                return 'No records found for the specified Id: ' + recordId;
            }
    
            for (SObject record : records) {
                record.put(arrayValue, finalString);
            }
    
            System.Database.update(records);
    
            return 'Fields updated successfully';
        } catch (Exception e) {
            return 'Error updating fields: ' + e.getMessage();
        }
    }
    
    /**
     * Checks if a field is updateable for a given object.
     * 
     * @param objectApiName String The API name of the object.
     * @param fieldName String The API name of the field to check.
     * @return Boolean True if the field is updateable; otherwise, false.
     * @description Checks if a field is updateable for a given object.
     * 
     */
    private static Boolean isFieldUpdateable(String objectApiName, String fieldName) {
        if (Schema.getGlobalDescribe().containsKey(objectApiName)) {
            Schema.DescribeFieldResult fieldDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap().get(fieldName).getDescribe();
            return fieldDescribe.isUpdateable();
        }
        return false;
    }
}