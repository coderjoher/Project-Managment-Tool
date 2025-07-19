-- Make peselite4@gmail.com a superadmin
UPDATE "User" 
SET is_superadmin = true 
WHERE email = 'peselite4@gmail.com';