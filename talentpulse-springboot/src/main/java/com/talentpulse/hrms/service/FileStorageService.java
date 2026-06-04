package com.talentpulse.hrms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the upload directory.", ex);
        }
    }

    public String storeFile(MultipartFile file, String folder, String subFolder) {
        // Normalize file name
        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.contains("..")) {
            throw new RuntimeException("Invalid file path name " + fileName);
        }

        try {
            Path targetDir = this.fileStorageLocation.resolve(folder).resolve(subFolder);
            Files.createDirectories(targetDir);

            Path targetLocation = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path matching Django structure e.g. "profiles/1/avatar.png"
            return folder + "/" + subFolder + "/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + fileName, ex);
        }
    }
}
