@isTest
public class PdfToTextForRecordPageTestClass {

    
    @isTest
    public static void getObjectFieldsTest(){
        
 		String objectApiName = 'Account';
        
        Test.startTest();
        List<String> fieldNames = PdfToTextForRecordPageController.getObjectFields(objectApiName);
        Test.stopTest();
        system.assertNotEquals(null, fieldNames, 'Returned Map should not be null');
        system.assert(fieldNames.contains('Name'), 'Name Field returned');
        
    }
    
    //savePDFContent(String recordId, String objectApiName, String selectedField, string finalString)
    
    @isTest
    public static void savePDFContent(){
		
       
        String objectApiName = 'Account';
        String selectedField = 'Name';
        String finalString = 'New Value';
			
        //test record
				Account obj = new Account();
        		
        		obj.Name = 'Old Value';
        		insert obj;
       			String recordId = obj.Id;
        
				//test
        		Test.StartTest();
        		 String result = PdfToTextForRecordPageController.savePDFContent(recordId, objectApiName, selectedField, finalString);	
				Test.StopTest();

        
        		System.assertEquals('Fields updated successfully', result, 'Expected successful update message');
        
				//check if updated
				Account ac = [SELECT Id, Name FROM Account WHERE Id = :recordId];
        		system.assertEquals(finalString, ac.Name, 'FieldUpdateSuccess');
        			
        
    }
    
    
}