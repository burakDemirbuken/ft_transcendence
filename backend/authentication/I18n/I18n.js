
export function getTranslations(lang) {
	const translations = {
		"eng": {
			"unotFound": "User not found.",
			"uname": {
				"empty": "Username parameter is required",
				"taken": "This username is taken.",
				"availible": "This username is availible to use.",
				"fail": "Username check failed."
			},
			"email": {
				"empty": "Email parameter is required",
				"taken": "This email is already registered.",
				"availible": "This email is availible to use.",
				"fail": "Email check failed."
			},
			"register": {
				"empty": "Required fields: Username, Email, Password.",
				"taken": "Username or email already in use.",
				"success": "Please check your email to verify your account.",
				"fail": "Verification not sent. Please check the email address.",
				"system": "Registration failed. Please try again later."
			},
			"token": {
				"notFound": "Please use the verification link from your email.",
				"expired": "Verification link expired. Please Register again.",
			},
			"verify": {
				"success": "Email verified successfully! You can now login.",
				"system": "Email verification failed. Please try again later."
			},
			"login": {
				"already": "You are already logged in.",
				"empty": "Required fields: Email/username, password.",
				"invalid": "Email/username or Password wrong.",
				"notverified": "Please check your inbox for verification.",
				"verify": "Please enter the 6-digit code from your email for verification.",
				"system": "Login failed. Please try again later.",
				"success": "Login successful."
			},
			"verify2FA": {
				"empty": "Required fields: Email/username, 2FA code.",
				"expired": "Code expired. Please login again.",
				"invalid": "Code invalid. Enter the 6-digit code from your email.",
				"system": "2FA verification failed. Please try again later."
			},
			"profile": {
				"fail": "Failed to get profile."
			},
			"logout": {
				"success:": "Logout successful.",
				"fail": "Logout fail."
			}
		},
		"deu": {
			"unotFound": "Benutzer nicht gefunden.",
			"uname": {
				"empty": "Benutzername ist erforderlich",
				"taken": "Dieser Benutzername ist bereits vergeben.",
				"availible": "Dieser Benutzername ist verfügbar.",
				"fail": "Benutzername-Prüfung fehlgeschlagen."
			},
			"email": {
				"empty": "E-Mail-Adresse ist erforderlich",
				"taken": "Diese E-Mail-Adresse ist bereits registriert.",
				"availible": "Diese E-Mail-Adresse ist verfügbar.",
				"fail": "E-Mail-Prüfung fehlgeschlagen."
			},
			"register": {
				"empty": "Erforderliche Felder: Benutzername, E-Mail, Passwort.",
				"taken": "Benutzername oder E-Mail-Adresse wird bereits verwendet.",
				"success": "Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu verifizieren.",
				"fail": "Bestätigung nicht gesendet. Bitte überprüfen Sie die E-Mail-Adresse.",
				"system": "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut."
			},
			"token": {
				"notFound": "Bitte verwenden Sie den Bestätigungslink aus Ihrer E-Mail.",
				"expired": "Bestätigungslink abgelaufen. Bitte registrieren Sie sich erneut."
			},
			"verify": {
				"success": "E-Mail erfolgreich verifiziert! Sie können sich jetzt anmelden.",
				"system": "E-Mail-Verifizierung fehlgeschlagen. Bitte versuchen Sie es später erneut."
			},
			"login": {
				"already": "Sie sind bereits angemeldet.",
				"empty": "Erforderliche Felder: E-Mail/Benutzername, Passwort.",
				"invalid": "E-Mail/Benutzername oder Passwort falsch.",
				"notverified": "Bitte überprüfen Sie Ihren Posteingang auf die Verifizierungs-E-Mail.",
				"verify": "Bitte geben Sie den 6-stelligen Code aus Ihrer E-Mail für Verifizerung ein.",
				"system": "Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
				"success": "Anmeldung erfolgreich."
			},
			"verify2FA": {
				"empty": "Erforderliche Felder: E-Mail/Benutzername, 2FA-Code.",
				"expired": "Code abgelaufen. Bitte melden Sie sich erneut an.",
				"invalid": "Ungültiger Code. Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.",
				"system": "2FA-Verifizierung fehlgeschlagen. Bitte versuchen Sie es später erneut."
			},
			"profile": {
				"fail": "Profil konnte nicht geladen werden."
			},
			"logout": {
				"success:": "Abmeldung erfolgreich.",
				"fail": "Abmeldung fehlgeschlagen."
			}
		},
		"tur": {
			"unotFound": "Kullanıcı bulunamadı.",
			"uname": {
				"empty": "Kullanıcı adı gereklidir",
				"taken": "Bu kullanıcı adı alınmış.",
				"availible": "Bu kullanıcı adı kullanılabilir.",
				"fail": "Kullanıcı adı kontrolü başarısız."
			},
			"email": {
				"empty": "E-posta gereklidir",
				"taken": "Bu e-posta adresi zaten kayıtlı.",
				"availible": "Bu e-posta adresi kullanılabilir.",
				"fail": "E-posta kontrolü başarısız."
			},
			"register": {
				"empty": "Gerekli alanlar: Kullanıcı adı, E-posta, Şifre.",
				"taken": "Kullanıcı adı veya e-posta adresi zaten kullanımda.",
				"success": "Hesabınızı doğrulamak için lütfen e-postanızı kontrol edin.",
				"fail": "Doğrulama gönderilemedi. Lütfen e-posta adresini kontrol edin.",
				"system": "Kayıt başarısız. Lütfen daha sonra tekrar deneyin."
			},
			"token": {
				"notFound": "Lütfen e-postanızdaki doğrulama bağlantısını kullanın.",
				"expired": "Doğrulama bağlantısının süresi doldu. Lütfen tekrar kayıt olun."
			},
			"verify": {
				"success": "E-posta başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.",
				"system": "E-posta doğrulama başarısız. Lütfen daha sonra tekrar deneyin."
			},
			"login": {
				"already": "Zaten giriş yapmış durumdasınız.",
				"empty": "Gerekli alanlar: E-posta/kullanıcı adı, şifre.",
				"invalid": "E-posta/kullanıcı adı veya şifre hatalı.",
				"notverified": "Doğrulama için lütfen gelen kutunuzu kontrol edin.",
				"verify": "Doğrulama için lütfen e-postanızdaki 6 haneli kodu girin.",
				"system": "Giriş başarısız. Lütfen daha sonra tekrar deneyin.",
				"success": "Giriş başarılı."
			},
			"verify2FA": {
				"empty": "Gerekli alanlar: E-posta/kullanıcı adı, 2FA kodu.",
				"expired": "Kodun süresi doldu. Lütfen tekrar giriş yapın.",
				"invalid": "Geçersiz kod. E-postanızdaki 6 haneli kodu girin.",
				"system": "2FA doğrulama başarısız. Lütfen daha sonra tekrar deneyin."
			},
			"profile": {
				"fail": "Profil alınamadı."
			},
			"logout": {
				"success:": "Çıkış başarılı.",
				"fail": "Çıkış başarısız."
			}
		}
	};
	return translations[lang];
}