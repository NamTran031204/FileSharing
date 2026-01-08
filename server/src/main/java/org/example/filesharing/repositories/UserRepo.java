package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends MongoRepository<UserEntity, String> {
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Search users by username or email using regex (case-insensitive)
     *
     * @param searchText the search text to match against publicUserName or email
     * @param pageable   pagination information
     * @return page of users matching the search criteria
     */
    @Query("{ $or: [ " +
            "{ 'publicUserName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } } " +
            "] }")
    Page<UserEntity> searchByUsernameOrEmail(String searchText, Pageable pageable);

    /**
     * Find all users with pagination
     *
     * @param pageable pagination information
     * @return page of all users
     */
    Page<UserEntity> findAll(Pageable pageable);
}
