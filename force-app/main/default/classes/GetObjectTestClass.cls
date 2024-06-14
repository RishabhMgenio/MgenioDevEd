@isTest
public class GetObjectTestClass {
     

	@isTest
	public static void testFetchAllObjectList(){
        
        //Test method to verify that testFetchAllObjectList method returns map of object.
        //Call the method to test.

        Test.startTest();
        Map<String, String> objectMap = GetObject.fetchAllObjectList();
        Test.stopTest();
        
       //Assert expected outcome
       system.assertNotEquals(null, objectMap, 'Returned Map should not be null');
       system.assertEquals('Account', objectMap.get('Account'), 'Account object should be returned');
        
     }
    
    @isTest
    public static void testfetchAllFieldList(){
        
        Test.startTest();
        Map<String,String> mapOfFields = GetObject.fetchAllFieldList('Account');
        Test.stopTest();
        
        system.assertNotEquals(null, mapOfFields, 'Returned Map should not be null');
        system.assertEquals('Name', mapOfFields.get('Name'), 'Field returned');
    } 
    
    @isTest 
    public static void testupdateField(){
        
        //test data
        String arrayValue = 'Name';
        String objectApiName = 'Account';
        String finalString = 'New Name';
        
        //test record
        Account ac = new Account();
        ac.Name = 'Old Value';
        insert ac;
        
        String recordId = ac.Id;
        
        //test updatefield method
        Test.startTest();
        String result = GetObject.updateField(recordId, arrayValue, objectApiName, finalString);
        Test.stopTest();
        
         // Assert the expected outcome
        
        System.assertEquals('Fields updated successfully', result, 'Expected successful update message');
        
        //query account record to check update field.
        Account testRecord = [SELECT Id, Name FROM Account WHERE Id = :recordId LIMIT 1];
      	system.assertEquals(finalString, testRecord.Name, 'FieldUpdateSuccess');
     	   
        
    }
    
    
    
    
    
    
    
    
    
}