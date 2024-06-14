//TestClass For CreatePdfsController
@isTest
public class CreatePdfsControllerTestClass {

    //testing FetchAllObjectList method
    @isTest
	public static void testFetchAllObjectList(){
        
       
        //Call the method to test.

        Test.startTest();
        Map<String, String> objectMap = CreatePdfsController.fetchAllObjectList();
        Test.stopTest();
        
       //Assert expected outcome
       system.assertNotEquals(null, objectMap, 'Returned Map should not be null');
       system.assertEquals('Account', objectMap.get('Account'), 'Account object should be returned');
        
     }
    
    
    //testing fetchAllFieldList method
    @isTest
    public static void testfetchAllFieldList(){
        
        //Testing
        Test.startTest();
        Map<String,String> mapOfFields = CreatePdfsController.fetchAllFieldList('Account');
        Test.stopTest();
        
        //assertStatements
        system.assertNotEquals(null, mapOfFields, 'Returned Map should not be null');
        system.assertEquals('Name', mapOfFields.get('Name'), 'Field returned');
    }
    
    
    //testing fetchAllFieldListforRecordPage method
    @isTest
    public static void testfetchAllFieldListforRecordPage(){
    	
        
        string strObjectName = 'Account';
        
        //Testing
        Test.startTest();
        Map<String,String> mapOfField = CreatePdfsController.fetchAllFieldListforRecordPage(strObjectName);
        test.stopTest();
	        
        //assertStatements
        system.assertNotEquals(null, mapOfField, 'Returned Map should not be null' );
        system.assertEquals('Name', mapOfField.get('Name'), 'Field returned');
        
    }
    
    //Testing processArray method
    @isTest
    public static void testprocessArray(){
        
        //SampleData
        
        Account ac = new Account();
        ac.Name = 'TestForPNPPDF';
        ac.Phone = '123123123';
        
        insert ac;
        
        List<String> stringArray = new List<String>{'Name', 'Phone'};
        String objectApiName = 'Account';
        
        String recordId = ac.Id;
			
        //Testing
        
        test.startTest();
        String result = CreatePdfsController.processArray(stringArray, objectApiName, recordId);
        test.stopTest();
        
            
        //assertStatementsExecution
        
        System.assertNotEquals('No records found for the specified Id: ' + recordId, result, 'Result should not be an error message');
        System.assert(result.contains('TestForPNPPDF'), 'Result should match expected string');
       	System.assert(result.contains('123123123'), 'Result should match expected string');
        
        
    }
    
    
}