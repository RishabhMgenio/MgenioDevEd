/**
 * Controller class for handling PDF to text conversion and updating record fields on the record page.
 * This class provides methods to retrieve updateable fields for a given object and to update a specified field value for a record.
 */
public with sharing class PdfToTextForRecordPageController {

    /**
     * Retrieves a list of updateable fields for a given object.
     * 
     * @param objectApiName String The API name of the object for which to retrieve updateable fields.
     * @return List<String> A list of updateable field names.
     * @description Retrieves a list of updateable fields for a given object.
     */
    @AuraEnabled
    public static List<String> getObjectFields(String objectApiName) {
        List<String> fieldNames = new List<String>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        Schema.SObjectType objectType = gd.get(objectApiName);
        if (objectType != null) {
            Schema.DescribeSObjectResult describeResult = objectType.getDescribe();
            for (Schema.SObjectField field : describeResult.fields.getMap().values()) {
                if (field.getDescribe().isUpdateable()) {
                    fieldNames.add(field.getDescribe().getName());
                }
            }
        }
        return fieldNames;
    }

    /**
     * Updates a specified field value for a record.
     * 
     * @param recordId String The Id of the record to update.
     * @param objectApiName String The API name of the object containing the record.
     * @param selectedField String The API name of the field to update.
     * @param finalString String The new value to set for the field.
     * @return String A message indicating the success or failure of the update operation.
     * @description Updates a specified field value for a record.
     */
    @AuraEnabled
    public static String savePDFContent(String recordId, String objectApiName, String selectedField, String finalString) { 
        try {
            if (!isFieldUpdateable(objectApiName, selectedField)) {
                return 'The field is not updateable.';
            }
            
            String query = 'SELECT Id, ' + selectedField + ' FROM ' + objectApiName + ' WHERE Id = :recordId LIMIT 1';
            sObject obj = Database.query(query); //NOPMD
            
            if (obj == null) {
                return 'No records found for the specified Id: ' + recordId;
            }
            
            obj.put(selectedField, finalString);
            System.Database.update(obj);
            
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
     */
    private static Boolean isFieldUpdateable(String objectApiName, String fieldName) {
        if (Schema.getGlobalDescribe().containsKey(objectApiName)) {
            Schema.DescribeFieldResult fieldDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap().get(fieldName).getDescribe();
            return fieldDescribe.isUpdateable();
        }
        return false;
    }
}